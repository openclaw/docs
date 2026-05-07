---
read_when:
    - 번들로 제공되는 Codex 앱 서버 하네스를 사용하려고 합니다
    - Codex 하네스 구성 예제가 필요합니다
    - Codex 전용 배포가 PI로 폴백하는 대신 실패하도록 하려는 경우
summary: 번들로 제공되는 Codex app-server 하니스를 통해 OpenClaw 임베디드 에이전트 턴 실행
title: Codex 하네스
x-i18n:
    generated_at: "2026-05-07T13:22:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

번들된 `codex` Plugin을 사용하면 OpenClaw가 기본 제공 PI 하네스 대신
Codex 앱 서버를 통해 임베디드 에이전트 턴을 실행할 수 있습니다.

Codex가 저수준 에이전트 세션을 소유하도록 하려는 경우 사용하세요: 모델
검색, 네이티브 스레드 재개, 네이티브 Compaction, 앱 서버 실행.
OpenClaw는 여전히 채팅 채널, 세션 파일, 모델 선택, 도구,
승인, 미디어 전달, 표시되는 트랜스크립트 미러를 소유합니다.

소스 채팅 턴이 Codex 하네스를 통해 실행될 때, 배포가
`messages.visibleReplies`를 명시적으로 구성하지 않았다면 표시되는 응답은 기본적으로
OpenClaw `message` 도구를 사용합니다. 에이전트는 여전히 Codex 턴을 비공개로 완료할 수 있으며,
`message(action="send")`를 호출할 때만 채널에 게시합니다.
기존 자동 전달 경로에서 직접 채팅 최종 응답을 유지하려면
`messages.visibleReplies: "automatic"`을 설정하세요.

Codex Heartbeat 턴도 기본적으로 `heartbeat_respond` 도구를 받으므로,
에이전트는 해당 제어 흐름을 최종 텍스트에 인코딩하지 않고도 깨우기를 조용히 유지할지
알림을 보낼지 기록할 수 있습니다.

Heartbeat 전용 주도성 가이드는 Heartbeat 턴 자체에서 Codex 협업 모드
개발자 지시사항으로 전송됩니다. 일반 채팅 턴은 정상 런타임 프롬프트에
Heartbeat 철학을 싣는 대신 Codex 기본 모드로 복원됩니다.

방향을 잡으려는 경우
[에이전트 런타임](/ko/concepts/agent-runtimes)부터 시작하세요. 짧게 말하면:
`openai/gpt-5.5`는 모델 참조이고, `codex`는 런타임이며, Telegram,
Discord, Slack 또는 다른 채널은 커뮤니케이션 표면으로 남습니다.

## 빠른 구성

"OpenClaw 안의 Codex"를 원하는 대부분의 사용자는 이 경로를 원합니다: 
ChatGPT/Codex 구독으로 로그인한 다음, 네이티브
Codex 앱 서버 런타임을 통해 임베디드 에이전트 턴을 실행합니다. 모델 참조는 여전히
`openai/gpt-*`로 표준을 유지합니다. 구독 인증은 `openai-codex/*` 모델 접두사가 아니라
Codex 계정/프로필에서 옵니다.

아직 하지 않았다면 먼저 Codex OAuth로 로그인하세요:

```bash
openclaw models auth login --provider openai-codex
```

그런 다음 번들된 `codex` Plugin을 활성화하고 Codex 런타임을 강제하세요:

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

구성이 `plugins.allow`를 사용하는 경우 거기에도 `codex`를 포함하세요:

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

구성에서 `openai-codex/gpt-*`를 사용하지 마세요. 그 접두사는
`openclaw doctor --fix`가 기본 모델, 폴백, Heartbeat/하위 에이전트/Compaction
오버라이드, 훅, 채널 오버라이드, 오래된 영속 세션 라우트 핀 전반에서
`openai/gpt-*`로 다시 쓰는 레거시 경로입니다.

## 이 Plugin이 바꾸는 것

번들된 `codex` Plugin은 여러 개별 기능을 제공합니다:

| 기능                              | 사용 방법                                            | 수행하는 작업                                                                 |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| 네이티브 임베디드 런타임          | `agentRuntime.id: "codex"`                          | OpenClaw 임베디드 에이전트 턴을 Codex 앱 서버를 통해 실행합니다.             |
| 네이티브 채팅 제어 명령           | `/codex bind`, `/codex resume`, `/codex steer`, ... | 메시징 대화에서 Codex 앱 서버 스레드를 바인딩하고 제어합니다.                |
| Codex 앱 서버 제공자/카탈로그     | `codex` 내부, 하네스를 통해 노출됨                  | 런타임이 앱 서버 모델을 검색하고 검증할 수 있게 합니다.                      |
| Codex 미디어 이해 경로            | `codex/*` 이미지 모델 호환성 경로                   | 지원되는 이미지 이해 모델에 대해 제한된 Codex 앱 서버 턴을 실행합니다.       |
| 네이티브 훅 릴레이                | Codex 네이티브 이벤트 주변의 Plugin 훅              | OpenClaw가 지원되는 Codex 네이티브 도구/종료 이벤트를 관찰/차단할 수 있게 합니다. |

Plugin을 활성화하면 이러한 기능을 사용할 수 있습니다. 활성화해도 다음을 하지는 않습니다:

- 이미지, 임베딩, 음성, realtime 같은 직접 OpenAI API 키 표면을 대체
- `openclaw doctor --fix` 없이 `openai-codex/*` 모델 참조를 변환
- ACP/acpx를 기본 Codex 경로로 설정
- 이미 PI 런타임을 기록한 기존 세션을 핫 스위치
- OpenClaw 채널 전달, 세션 파일, 인증 프로필 저장소 또는 메시지 라우팅을 대체

같은 Plugin은 네이티브 `/codex` 채팅 제어 명령 표면도 소유합니다. Plugin이
활성화되어 있고 사용자가 채팅에서 Codex 스레드를 바인딩, 재개, 조종, 중지 또는 검사하도록 요청하면,
에이전트는 ACP보다 `/codex ...`를 우선해야 합니다. ACP는 사용자가 ACP/acpx를 요청하거나 ACP
Codex 어댑터를 테스트할 때 명시적 폴백으로 남습니다.

네이티브 Codex 턴은 OpenClaw Plugin 훅을 공개 호환성 계층으로 유지합니다.
이들은 프로세스 내 OpenClaw 훅이며, Codex `hooks.json` 명령 훅이 아닙니다:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write`는 미러링된 트랜스크립트 레코드용
- `before_agent_finalize`는 Codex `Stop` 릴레이를 통함
- `agent_end`

Plugin은 런타임 중립 도구 결과 미들웨어도 등록해, OpenClaw가 도구를 실행한 뒤
결과가 Codex로 반환되기 전에 OpenClaw 동적 도구 결과를 다시 쓸 수 있습니다.
이는 OpenClaw가 소유한 트랜스크립트 도구 결과 쓰기를 변환하는 공개
`tool_result_persist` Plugin 훅과는 별개입니다.

Plugin 훅 의미 체계 자체는 [Plugin 훅](/ko/plugins/hooks) 및
[Plugin 가드 동작](/ko/tools/plugin)을 참조하세요.

OpenAI 에이전트 모델 참조는 기본적으로 하네스를 사용합니다. 새 구성은 OpenAI 모델 참조를
`openai/gpt-*`로 표준 유지해야 합니다. `agentRuntime.id: "codex"`는 여전히 유효하지만
OpenAI 에이전트 턴에 더 이상 필요하지 않습니다. 레거시 `codex/*`
모델 참조는 호환성을 위해 여전히 하네스를 자동 선택하지만,
런타임으로 뒷받침되는 레거시 제공자 접두사는 일반 모델/제공자 선택지로 표시되지 않습니다.

구성된 모델 라우트가 아직 `openai-codex/*`라면, `openclaw doctor --fix`가
이를 `openai/*`로 다시 씁니다. 일치하는 에이전트 라우트의 경우 에이전트 런타임을
`codex`로 설정하고 기존 `openai-codex` 인증 프로필 오버라이드를 보존합니다.

## 라우트 맵

구성을 변경하기 전에 이 표를 사용하세요:

| 원하는 동작                                           | 모델 참조                  | 런타임 구성                            | 인증/프로필 라우트            | 예상 상태 레이블            |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ------------------------------ | ---------------------------- |
| 네이티브 Codex 런타임을 사용하는 ChatGPT/Codex 구독 | `openai/gpt-*`             | 생략 또는 `agentRuntime.id: "codex"`   | Codex OAuth 또는 Codex 계정    | `Runtime: OpenAI Codex`      |
| 에이전트 모델용 OpenAI API 키 인증                   | `openai/gpt-*`             | 생략 또는 `agentRuntime.id: "codex"`   | `openai-codex` API 키 프로필   | `Runtime: OpenAI Codex`      |
| doctor 복구가 필요한 레거시 구성                     | `openai-codex/gpt-*`       | `codex`로 복구됨                       | 기존에 구성된 인증             | `doctor --fix` 후 다시 확인 |
| 보수적 자동 모드의 혼합 제공자                       | 제공자별 참조              | `agentRuntime.id: "auto"`              | 선택한 제공자별                | 선택한 런타임에 따라 다름   |
| 명시적 Codex ACP 어댑터 세션                         | ACP 프롬프트/모델에 따라 다름 | `sessions_spawn` 및 `runtime: "acp"` | ACP 백엔드 인증                | ACP 작업/세션 상태          |

중요한 구분은 제공자와 런타임입니다:

- `openai-codex/*`는 doctor가 다시 쓰는 레거시 라우트입니다.
- `agentRuntime.id: "codex"`는 Codex 하네스를 요구하며 사용할 수 없으면 실패로 닫힙니다.
- `agentRuntime.id: "auto"`는 등록된 하네스가 일치하는 제공자 라우트를 클레임하도록 합니다. OpenAI 에이전트 참조는 PI 대신 Codex로 해석됩니다.
- `/codex ...`는 "이 채팅이 어떤 네이티브 Codex 대화에 바인딩되거나 이를 제어해야 하는가?"에 답합니다.
- ACP는 "acpx가 어떤 외부 하네스 프로세스를 실행해야 하는가?"에 답합니다.

## 올바른 모델 접두사 선택

OpenAI 계열 라우트는 접두사별로 다릅니다. 일반적인 구독과
네이티브 Codex 런타임 설정에는 `openai/*`를 사용하세요.
`openai-codex/*`는 doctor가 다시 써야 하는 레거시 구성으로 취급하세요:

| 모델 참조                                         | 런타임 경로                              | 사용할 때                                                         |
| ------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `openai/gpt-5.4`                                  | 에이전트 턴용 Codex 앱 서버 하네스       | Codex를 통해 OpenAI 에이전트 모델을 사용하려는 경우.              |
| `openai-codex/gpt-5.5`                            | doctor가 복구하는 레거시 라우트          | 오래된 구성에 있는 경우. `openclaw doctor --fix`를 실행해 다시 쓰세요. |
| `openai/gpt-5.5` + `openai-codex` API 키 프로필 | Codex 앱 서버 하네스                     | OpenAI 에이전트 모델에 API 키 인증을 사용하려는 경우.             |

계정이 노출하는 경우 GPT-5.5는 직접 OpenAI API 키 라우트와 Codex 구독 라우트 모두에
나타날 수 있습니다. 네이티브 Codex 런타임에는 Codex 앱 서버 하네스와 함께
`openai/gpt-5.5`를 사용하고, 직접 API 키 트래픽에는 Codex 런타임 오버라이드 없이
`openai/gpt-5.5`를 사용하세요.

레거시 `codex/gpt-*` 참조는 호환성 별칭으로 계속 허용됩니다. Doctor
호환성 마이그레이션은 레거시 런타임 참조를 표준 모델 참조로 다시 쓰고
런타임 정책을 별도로 기록합니다. 새 네이티브 앱 서버 하네스 구성은
`openai/gpt-*`와 `agentRuntime.id: "codex"`를 사용해야 합니다.

`agents.defaults.imageModel`도 같은 접두사 구분을 따릅니다. 일반 OpenAI 라우트에는
`openai/gpt-*`를 사용하고, 이미지 이해가 제한된 Codex 앱 서버 턴을 통해 실행되어야 할 때는
`codex/gpt-*`를 사용하세요. `openai-codex/gpt-*`를 사용하지 마세요. doctor는 해당 레거시 접두사를
`openai/gpt-*`로 다시 씁니다. Codex 앱 서버 모델은 이미지 입력 지원을 광고해야 하며,
텍스트 전용 Codex 모델은 미디어 턴이 시작되기 전에 실패합니다.

현재 세션의 유효 하네스를 확인하려면 `/status`를 사용하세요. 선택이 예상과 다르다면
`agents/harness` 하위 시스템에 대해 디버그 로깅을 활성화하고 Gateway의 구조화된
`agent harness selected` 레코드를 검사하세요. 여기에는 선택된 하네스 id, 선택 이유,
런타임/폴백 정책, 그리고 `auto` 모드에서는 각 Plugin 후보의 지원 결과가 포함됩니다.

### doctor 경고의 의미

`openclaw doctor`는 구성된 모델 참조나 영속 세션 라우트 상태가 아직
`openai-codex/*`를 사용할 때 경고합니다. `openclaw doctor --fix`는 해당 라우트를
다음으로 다시 씁니다:

- `openai/<model>`
- `agentRuntime.id: "codex"`

`codex` 라우트는 네이티브 Codex 하네스를 강제합니다. OpenAI 에이전트 모델 턴에는
PI 런타임 구성이 허용되지 않습니다.
Doctor는 발견된 에이전트 세션 저장소 전반에서 오래된 영속 세션 핀도 복구하므로
이전 대화가 제거된 라우트에 계속 고착되지 않습니다.

하네스 선택은 실시간 세션 제어가 아닙니다. 임베디드 턴이 실행되면,
OpenClaw는 해당 세션에 선택된 하네스 id를 기록하고 같은 세션 id의 이후 턴에도 계속 사용합니다.
향후 세션이 다른 하네스를 사용하도록 하려면 `agentRuntime` 구성 또는
`OPENCLAW_AGENT_RUNTIME`을 변경하세요. 기존 대화를 PI와 Codex 사이에서 전환하기 전에
`/new` 또는 `/reset`으로 새 세션을 시작하세요. 이렇게 하면 하나의 트랜스크립트를
호환되지 않는 두 네이티브 세션 시스템을 통해 재생하는 일을 피할 수 있습니다.

하네스 핀이 도입되기 전에 생성된 레거시 세션은 트랜스크립트 기록이 있으면 PI에 핀된 것으로 처리됩니다.
구성을 변경한 뒤 해당 대화를 Codex로 선택하려면 `/new` 또는 `/reset`을 사용하세요.

`/status`는 유효 모델 런타임을 표시합니다. 기본 PI 하네스는
`Runtime: OpenClaw Pi Default`로 표시되고, Codex 앱 서버 하네스는
`Runtime: OpenAI Codex`로 표시됩니다.

## 요구 사항

- 번들된 `codex` Plugin을 사용할 수 있는 OpenClaw.
- Codex app-server `0.125.0` 이상. 번들된 Plugin은 기본적으로 호환되는
  Codex app-server 바이너리를 관리하므로, `PATH`의 로컬 `codex` 명령은
  일반 하네스 시작에 영향을 주지 않습니다.
- app-server 프로세스 또는 OpenClaw의 Codex 인증 브리지에서 Codex 인증을
  사용할 수 있어야 합니다. 로컬 app-server 실행은 각 에이전트에 대해
  OpenClaw가 관리하는 Codex 홈과 격리된 하위 `HOME`을 사용하므로, 기본적으로
  개인 `~/.codex` 계정, skills, plugins, config, thread 상태 또는 네이티브
  `$HOME/.agents/skills`를 읽지 않습니다.

Plugin은 오래되었거나 버전이 없는 app-server 핸드셰이크를 차단합니다. 이를 통해
OpenClaw는 테스트된 프로토콜 표면을 유지합니다.

라이브 및 Docker 스모크 테스트의 경우 인증은 보통 Codex CLI 계정 또는 OpenClaw
`openai-codex` 인증 프로필에서 가져옵니다. 로컬 stdio app-server 실행은 계정이
없을 때 `CODEX_API_KEY` / `OPENAI_API_KEY`로도 폴백할 수 있습니다.

## 워크스페이스 부트스트랩 파일

Codex는 네이티브 프로젝트 문서 검색을 통해 `AGENTS.md`를 자체적으로 처리합니다. OpenClaw는
합성 Codex 프로젝트 문서 파일을 작성하지 않으며, persona 파일에 대해 Codex 폴백
파일명에 의존하지 않습니다. Codex 폴백은 `AGENTS.md`가 없을 때만 적용되기
때문입니다.

OpenClaw 워크스페이스 동등성을 위해, Codex 하네스는 다른 부트스트랩
파일(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md`, 그리고 존재하는 경우 `MEMORY.md`)을 해석하고 `thread/start` 및
`thread/resume`의 Codex 개발자 지침을 통해 전달합니다. 이렇게 하면
`AGENTS.md`를 복제하지 않고도 `SOUL.md` 및 관련 워크스페이스 persona/프로필
컨텍스트가 네이티브 Codex 동작 형성 경로에 표시됩니다.

## 다른 모델과 함께 Codex 추가

동일한 에이전트가 Codex와 비 Codex 공급자 모델 사이를 자유롭게 전환해야 한다면
전역으로 `agentRuntime.id: "codex"`를 설정하지 마세요. 강제 런타임은 해당 에이전트
또는 세션의 모든 임베디드 턴에 적용됩니다. 해당 런타임이 강제된 상태에서 Anthropic
모델을 선택하면, OpenClaw는 여전히 Codex 하네스를 시도하고 해당 턴을 조용히 PI로
라우팅하는 대신 닫힌 방식으로 실패합니다.

대신 다음 형태 중 하나를 사용하세요.

- `agentRuntime.id: "codex"`를 사용해 Codex를 전용 에이전트에 둡니다.
- 일반적인 혼합 공급자 사용을 위해 기본 에이전트를 `agentRuntime.id: "auto"`와 PI 폴백으로 유지합니다.
- 레거시 `codex/*` 참조는 호환성을 위해서만 사용합니다. 새 config는
  `openai/*`와 명시적 Codex 런타임 정책을 선호해야 합니다.

예를 들어, 다음은 기본 에이전트를 일반 자동 선택 상태로 유지하고
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
- `codex` 에이전트는 Codex app-server 하네스를 사용합니다.
- `codex` 에이전트에 Codex가 없거나 지원되지 않으면, PI를 조용히 사용하는 대신
  해당 턴이 실패합니다.

## 에이전트 명령 라우팅

에이전트는 "Codex"라는 단어만이 아니라 의도에 따라 사용자 요청을 라우팅해야 합니다.

| 사용자가 요청하는 것...                                | 에이전트가 사용해야 하는 것...                       |
| ------------------------------------------------------ | ------------------------------------------------ |
| "이 채팅을 Codex에 바인딩"                             | `/codex bind`                                    |
| "여기에서 Codex 스레드 `<id>` 재개"                    | `/codex resume <id>`                             |
| "Codex 스레드 표시"                                   | `/codex threads`                                 |
| "문제가 있는 Codex 실행에 대한 지원 보고서 제출"       | `/diagnostics [note]`                            |
| "이 첨부된 스레드에 대해서만 Codex 피드백 보내기"      | `/codex diagnostics [note]`                      |
| "Codex 런타임에서 내 ChatGPT/Codex 구독 사용"          | `openai/*`                                       |
| "이전 `openai-codex/*` config/session 고정 복구"       | `openclaw doctor --fix`                          |
| "ACP/acpx를 통해 Codex 실행"                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| "스레드에서 Claude Code/Gemini/OpenCode/Cursor 시작"   | ACP/acpx, `/codex`도 네이티브 하위 에이전트도 아님 |

OpenClaw는 ACP가 활성화되어 있고, 디스패치 가능하며, 로드된 런타임 백엔드로 뒷받침될 때만
에이전트에 ACP spawn 안내를 알립니다. ACP를 사용할 수 없으면, 시스템 프롬프트와 Plugin
Skills는 에이전트에게 ACP 라우팅을 가르치지 않아야 합니다.

## Codex 전용 배포

모든 임베디드 에이전트 턴이 Codex를 사용하는지 증명해야 할 때 Codex 하네스를
강제하세요. 명시적 Plugin 런타임은 닫힌 방식으로 실패하며 PI를 통해 조용히 재시도되지
않습니다.

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

환경 오버라이드:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex가 강제되면, Codex Plugin이 비활성화되어 있거나, app-server가 너무 오래되었거나,
app-server를 시작할 수 없는 경우 OpenClaw가 일찍 실패합니다.

## 에이전트별 Codex

기본 에이전트는 일반 자동 선택을 유지하면서 한 에이전트만 Codex 전용으로 만들 수
있습니다.

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
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

에이전트와 모델을 전환하려면 일반 세션 명령을 사용하세요. `/new`는 새
OpenClaw 세션을 만들고, Codex 하네스는 필요에 따라 사이드카 app-server 스레드를
만들거나 재개합니다. `/reset`은 해당 스레드에 대한 OpenClaw 세션 바인딩을 지우고
다음 턴이 현재 config에서 하네스를 다시 해석하도록 합니다.

## 모델 검색

기본적으로 Codex Plugin은 app-server에 사용 가능한 모델을 요청합니다. 검색이
실패하거나 시간 초과되면, 다음 항목에 대해 번들된 폴백 카탈로그를 사용합니다.

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

`plugins.entries.codex.config.discovery` 아래에서 검색을 조정할 수 있습니다.

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

시작 시 Codex를 프로빙하지 않고 폴백 카탈로그를 유지하려면 검색을 비활성화하세요.

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

기본적으로 Plugin은 OpenClaw가 관리하는 Codex 바이너리를 로컬에서 다음과 같이
시작합니다.

```bash
codex app-server --listen stdio://
```

관리되는 바이너리는 `codex` Plugin 패키지와 함께 제공됩니다. 이렇게 하면
app-server 버전이 로컬에 별도로 설치된 Codex CLI가 무엇이든 관계없이 번들된 Plugin에
연결됩니다. 의도적으로 다른 실행 파일을 실행하려는 경우에만 `appServer.command`를
설정하세요.

기본적으로 OpenClaw는 로컬 Codex 하네스 세션을 YOLO 모드로 시작합니다.
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, 그리고
`sandbox: "danger-full-access"`입니다. 이는 자율 Heartbeat에 사용되는 신뢰할 수 있는
로컬 운영자 자세입니다. Codex는 아무도 응답할 수 없는 네이티브 승인 프롬프트에서
멈추지 않고 셸 및 네트워크 도구를 사용할 수 있습니다.

Codex guardian 검토 승인으로 옵트인하려면 `appServer.mode:
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
샌드박스를 벗어나거나, 워크스페이스 밖에 쓰거나, 네트워크 액세스 같은 권한을 추가하도록
요청하면, Codex는 해당 승인 요청을 사람 프롬프트 대신 네이티브 검토자에게 라우팅합니다.
검토자는 Codex의 위험 프레임워크를 적용하고 특정 요청을 승인하거나 거부합니다. YOLO 모드보다
더 많은 보호 장치가 필요하지만 무인 에이전트가 계속 진행해야 할 때 Guardian을 사용하세요.

`guardian` 프리셋은 `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, 그리고 `sandbox: "workspace-write"`로
확장됩니다. 개별 정책 필드는 여전히 `mode`를 오버라이드하므로, 고급 배포에서는
프리셋과 명시적 선택을 혼합할 수 있습니다. 이전 `guardian_subagent` 검토자 값은
호환성 별칭으로 계속 허용되지만, 새 config는 `auto_review`를 사용해야 합니다.

이미 실행 중인 app-server에는 WebSocket 전송을 사용하세요.

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

Stdio app-server 실행은 기본적으로 OpenClaw의 프로세스 환경을 상속하지만,
OpenClaw는 Codex app-server 계정 브리지를 소유하고 `CODEX_HOME`과 `HOME`을 모두
해당 에이전트의 OpenClaw 상태 아래에 있는 에이전트별 디렉터리로 설정합니다. Codex의
자체 skill 로더는 `$CODEX_HOME/skills`와 `$HOME/.agents/skills`를 읽으므로,
로컬 app-server 실행에서는 두 값이 모두 격리됩니다. 이렇게 하면 Codex 네이티브
skills, plugins, config, accounts, thread 상태가 운영자의 개인 Codex CLI 홈에서
유출되지 않고 OpenClaw 에이전트로 범위가 제한됩니다.

OpenClaw plugins와 OpenClaw skill 스냅샷은 여전히 OpenClaw의 자체 Plugin 레지스트리와
skill 로더를 통해 흐릅니다. 개인 Codex CLI 자산은 그렇지 않습니다. OpenClaw 에이전트의
일부가 되어야 하는 유용한 Codex CLI skills 또는 plugins가 있다면 명시적으로
인벤토리를 만드세요.

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Codex 마이그레이션 공급자는 skills를 현재 OpenClaw 에이전트 워크스페이스로 복사합니다.
Codex 네이티브 plugins, hooks, config 파일은 명령을 실행하거나, MCP 서버를 노출하거나,
자격 증명을 포함할 수 있으므로 자동으로 활성화되는 대신 수동 검토를 위해 보고되거나
보관됩니다.

인증은 다음 순서로 선택됩니다.

1. 에이전트에 대한 명시적 OpenClaw Codex 인증 프로필.
2. 해당 에이전트의 Codex 홈에 있는 app-server의 기존 계정.
3. 로컬 stdio app-server 실행에 한해서만, app-server 계정이 없고 OpenAI 인증이
   여전히 필요한 경우 `CODEX_API_KEY`, 그다음 `OPENAI_API_KEY`.

OpenClaw가 ChatGPT 구독 스타일의 Codex 인증 프로필을 발견하면 생성된 Codex 하위
프로세스에서 `CODEX_API_KEY`와 `OPENAI_API_KEY`를 제거합니다. 이렇게 하면 임베딩 또는
직접 OpenAI 모델을 위해 Gateway 수준 API 키를 사용할 수 있으면서도, 네이티브 Codex
app-server 턴이 실수로 API를 통해 청구되지 않습니다. 명시적 Codex API 키 프로필과
로컬 stdio 환경 키 폴백은 상속된 하위 프로세스 환경 대신 app-server 로그인을 사용합니다.
WebSocket app-server 연결은 Gateway 환경 API 키 폴백을 받지 않습니다. 명시적 인증
프로필 또는 원격 app-server의 자체 계정을 사용하세요.

배포에 추가 환경 격리가 필요하면 해당 변수를 `appServer.clearEnv`에 추가하세요.

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

`appServer.clearEnv`는 생성된 Codex app-server 하위 프로세스에만 영향을 줍니다.

Codex 동적 도구는 기본적으로 `native-first` 프로필을 사용합니다. 이 모드에서는
OpenClaw가 Codex 네이티브 워크스페이스 작업과 중복되는 동적 도구를 노출하지 않습니다:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, 그리고
`update_plan`. 메시징, 세션, 미디어, cron, 브라우저, 노드, gateway,
`heartbeat_respond`, `web_search` 같은 OpenClaw 통합 도구는 계속 사용할 수 있습니다.

지원되는 최상위 Codex plugin 필드:

| 필드                       | 기본값           | 의미                                                                                             |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsProfile` | `"native-first"` | Codex app-server에 전체 OpenClaw 동적 도구 세트를 노출하려면 `"openclaw-compat"`를 사용합니다. |
| `codexDynamicToolsExclude` | `[]`             | Codex app-server 턴에서 생략할 추가 OpenClaw 동적 도구 이름입니다.                              |

지원되는 `appServer` 필드:

| 필드                          | 기본값                                   | 의미                                                                                                                                                                                                                   |
| ----------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                | `"stdio"`는 Codex를 생성하고, `"websocket"`은 `url`에 연결합니다.                                                                                                                                                       |
| `command`                     | 관리되는 Codex 바이너리                 | stdio transport용 실행 파일입니다. 관리되는 바이너리를 사용하려면 설정하지 마세요. 명시적으로 재정의할 때만 설정합니다.                                                                                                |
| `args`                        | `["app-server", "--listen", "stdio://"]` | stdio transport용 인수입니다.                                                                                                                                                                                          |
| `url`                         | 설정되지 않음                           | WebSocket app-server URL입니다.                                                                                                                                                                                        |
| `authToken`                   | 설정되지 않음                           | WebSocket transport용 Bearer 토큰입니다.                                                                                                                                                                                |
| `headers`                     | `{}`                                     | 추가 WebSocket 헤더입니다.                                                                                                                                                                                             |
| `clearEnv`                    | `[]`                                     | OpenClaw가 상속 환경을 만든 뒤 생성된 stdio app-server 프로세스에서 제거할 추가 환경 변수 이름입니다. `CODEX_HOME`과 `HOME`은 로컬 실행에서 OpenClaw의 에이전트별 Codex 격리를 위해 예약되어 있습니다. |
| `requestTimeoutMs`            | `60000`                                  | app-server 제어 플레인 호출의 타임아웃입니다.                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | OpenClaw가 `turn/completed`를 기다리는 동안 턴 범위 Codex app-server 요청 후의 조용한 창입니다. 느린 post-tool 또는 상태 전용 합성 단계에는 이 값을 높이세요.                                                         |
| `mode`                        | `"yolo"`                                 | YOLO 또는 guardian 검토 실행을 위한 프리셋입니다.                                                                                                                                                                      |
| `approvalPolicy`              | `"never"`                                | 스레드 시작/재개/턴에 전송되는 네이티브 Codex 승인 정책입니다.                                                                                                                                                         |
| `sandbox`                     | `"danger-full-access"`                   | 스레드 시작/재개에 전송되는 네이티브 Codex 샌드박스 모드입니다.                                                                                                                                                        |
| `approvalsReviewer`           | `"user"`                                 | Codex가 네이티브 승인 프롬프트를 검토하게 하려면 `"auto_review"`를 사용합니다. `guardian_subagent`는 레거시 별칭으로 유지됩니다.                                                                                       |
| `serviceTier`                 | 설정되지 않음                           | 선택적 Codex app-server 서비스 티어: `"fast"`, `"flex"` 또는 `null`. 유효하지 않은 레거시 값은 무시됩니다.                                                                                                            |

OpenClaw가 소유한 동적 도구 호출은 `appServer.requestTimeoutMs`와 별도로
제한됩니다. 각 Codex `item/tool/call` 요청은 30초 안에 OpenClaw 응답을 받아야
합니다. 타임아웃 시 OpenClaw는 지원되는 경우 도구 신호를 중단하고 실패한
동적 도구 응답을 Codex에 반환하여, 세션을 `processing` 상태로 남겨두는 대신
턴이 계속될 수 있게 합니다.

OpenClaw가 Codex 턴 범위 app-server 요청에 응답한 뒤, 하네스는 Codex가
네이티브 턴을 `turn/completed`로 완료하기도 기대합니다. 그 응답 이후
app-server가 `appServer.turnCompletionIdleTimeoutMs` 동안 조용하면 OpenClaw는
최선의 노력으로 Codex 턴을 인터럽트하고, 진단 타임아웃을 기록하며, 후속 채팅
메시지가 오래된 네이티브 턴 뒤에 대기하지 않도록 OpenClaw 세션 레인을
해제합니다. `rawResponseItem/completed`를 포함해 같은 턴의 터미널이 아닌
알림은 Codex가 턴이 아직 살아 있음을 입증했으므로 이 짧은 watchdog을
해제합니다. 더 긴 터미널 watchdog은 실제로 멈춘 턴을 계속 보호합니다.
타임아웃 진단에는 마지막 app-server 알림 메서드가 포함되며, 원시 assistant
응답 항목의 경우 항목 타입, 역할, id, 제한된 assistant 텍스트 미리보기가
포함됩니다.

로컬 테스트를 위한 환경 재정의는 계속 사용할 수 있습니다:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`은 `appServer.command`가 설정되지 않은 경우
관리되는 바이너리를 우회합니다.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다. 대신
`plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나,
일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`을 사용하세요.
반복 가능한 배포에는 config가 권장됩니다. 이는 Codex 하네스 설정의 나머지와
같이 검토되는 파일에 plugin 동작을 유지하기 때문입니다.

## 컴퓨터 사용

Computer Use는 자체 설정 가이드에서 다룹니다:
[Codex Computer Use](/ko/plugins/codex-computer-use).

짧게 말하면, OpenClaw는 데스크톱 제어 앱을 vendoring하지 않으며 데스크톱
동작을 직접 실행하지도 않습니다. OpenClaw는 Codex app-server를 준비하고,
`computer-use` MCP 서버를 사용할 수 있는지 확인한 뒤, Codex 모드 턴 동안
Codex가 네이티브 MCP 도구 호출을 처리하게 합니다.

Codex marketplace 흐름 밖에서 직접 TryCua 드라이버에 접근하려면
`openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`로
`cua-driver mcp`를 등록하세요. Codex가 소유한 Computer Use와 직접 MCP 등록의
차이는 [Codex Computer Use](/ko/plugins/codex-computer-use)를 참고하세요.

최소 config:

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

Computer Use는 macOS 전용이며 Codex MCP 서버가 앱을 제어하기 전에 로컬 OS
권한이 필요할 수 있습니다. `computerUse.enabled`가 true이고 MCP 서버를 사용할
수 없으면 Codex 모드 턴은 네이티브 Computer Use 도구 없이 조용히 실행되는
대신 스레드가 시작되기 전에 실패합니다. marketplace 선택지, 원격 카탈로그
제한, 상태 사유, 문제 해결은 [Codex Computer Use](/ko/plugins/codex-computer-use)를
참고하세요.

`computerUse.autoInstall`이 true이면 Codex가 아직 로컬 marketplace를 발견하지
못한 경우 OpenClaw는 `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`에서
표준 번들 Codex Desktop marketplace를 등록할 수 있습니다. 런타임 또는 Computer Use
config를 변경한 뒤에는 기존 세션이 오래된 PI 또는 Codex 스레드 바인딩을 유지하지
않도록 `/new` 또는 `/reset`을 사용하세요.

## 일반 레시피

기본 stdio transport를 사용하는 로컬 Codex:

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

Guardian 검토 Codex 승인:

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

모델 전환은 OpenClaw가 계속 제어합니다. OpenClaw 세션이 기존 Codex 스레드에
연결되어 있을 때, 다음 턴은 현재 선택된 OpenAI 모델, 공급자, 승인 정책,
샌드박스, 서비스 티어를 app-server에 다시 전송합니다. `openai/gpt-5.5`에서
`openai/gpt-5.2`로 전환하면 스레드 바인딩은 유지하면서 Codex에 새로 선택된
모델로 계속 진행하도록 요청합니다.

## Codex 명령

번들 plugin은 `/codex`를 승인된 slash 명령으로 등록합니다. 이 명령은
일반적이며 OpenClaw 텍스트 명령을 지원하는 모든 채널에서 작동합니다.

일반 형식:

- `/codex status`는 실시간 앱 서버 연결 상태, 모델, 계정, 사용량 제한, MCP 서버, Skills를 표시합니다.
- `/codex models`는 실시간 Codex 앱 서버 모델을 나열합니다.
- `/codex threads [filter]`는 최근 Codex 스레드를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을 기존 Codex 스레드에 연결합니다.
- `/codex compact`는 Codex 앱 서버에 연결된 스레드를 압축하도록 요청합니다.
- `/codex review`는 연결된 스레드에 대해 Codex 네이티브 리뷰를 시작합니다.
- `/codex diagnostics [note]`는 연결된 스레드에 대한 Codex 진단 피드백을 보내기 전에 확인을 요청합니다.
- `/codex computer-use status`는 구성된 컴퓨터 사용 Plugin과 MCP 서버를 확인합니다.
- `/codex computer-use install`은 구성된 컴퓨터 사용 Plugin을 설치하고 MCP 서버를 다시 로드합니다.
- `/codex account`는 계정 및 사용량 제한 상태를 표시합니다.
- `/codex mcp`는 Codex 앱 서버 MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex 앱 서버 Skills를 나열합니다.

Codex가 사용량 제한 실패를 보고하면, Codex가 제공한 경우 OpenClaw는 다음
앱 서버 재설정 시간을 포함합니다. 현재 계정 및 사용량 제한 기간을 확인하려면 같은
대화에서 `/codex account`를 사용하세요.

### 일반적인 디버깅 워크플로

Codex 기반 에이전트가 Telegram, Discord, Slack 또는 다른 채널에서
예상치 못한 동작을 하면, 문제가 발생한 대화에서 시작하세요.

1. `/diagnostics bad tool choice after image upload` 또는 관찰한 내용을 설명하는 다른 짧은 메모를
   실행합니다.
2. 진단 요청을 한 번 승인합니다. 승인은 로컬 Gateway
   진단 zip을 생성하고, 세션이 Codex 하네스를 사용 중이므로
   관련 Codex 피드백 번들도 OpenAI 서버로 전송합니다.
3. 완료된 진단 응답을 버그 보고서 또는 지원 스레드에 복사합니다.
   여기에는 로컬 번들 경로, 개인정보 요약, OpenClaw 세션 ID,
   Codex 스레드 ID, 각 Codex 스레드에 대한 `Inspect locally` 줄이 포함됩니다.
4. 실행을 직접 디버그하려면 출력된 `Inspect locally`
   명령을 터미널에서 실행합니다. 이 명령은 `codex resume <thread-id>`처럼 보이며
   네이티브 Codex 스레드를 열어 대화를 검사하거나, 로컬에서 계속 진행하거나,
   Codex가 특정 도구 또는 계획을 선택한 이유를 물어볼 수 있게 합니다.

전체 OpenClaw Gateway 진단 번들 없이 현재 연결된 스레드에 대한 Codex
피드백 업로드만 특별히 원하는 경우에만 `/codex diagnostics [note]`를 사용하세요.
대부분의 지원 보고서에서는 `/diagnostics [note]`가
로컬 Gateway 상태와 Codex 스레드 ID를 하나의 응답으로 묶어 주므로 더 나은 시작점입니다.
전체 개인정보 모델과 그룹 채팅 동작은 [진단 내보내기](/ko/gateway/diagnostics)를 참조하세요.

핵심 OpenClaw는 일반 Gateway 진단 명령으로 소유자 전용 `/diagnostics [note]`도 노출합니다.
승인 프롬프트는 민감한 데이터
전문을 표시하고, [진단 내보내기](/ko/gateway/diagnostics)로 연결하며, 매번 명시적 exec 승인을 통해
`openclaw gateway diagnostics export --json`을 요청합니다.
전체 허용 규칙으로 진단을 승인하지 마세요. 승인 후
OpenClaw는 로컬 번들 경로와 매니페스트
요약이 포함된 붙여넣기 가능한 보고서를 보냅니다. 활성 OpenClaw 세션이 Codex 하네스를 사용 중이면,
동일한 승인으로 관련 Codex 피드백 번들을
OpenAI 서버로 보내는 것도 승인됩니다. 승인 프롬프트는 Codex 피드백이 전송된다고 말하지만,
승인 전에는 Codex 세션 또는 스레드 ID를 나열하지 않습니다.

그룹 채팅에서 소유자가 `/diagnostics`를 호출하면 OpenClaw는
공유 채널을 깔끔하게 유지합니다. 그룹에는 짧은 알림만 수신되고,
진단 전문, 승인 프롬프트, Codex 세션/스레드 ID는
비공개 승인 경로를 통해 소유자에게 전송됩니다. 비공개 소유자 경로가 없으면,
OpenClaw는 그룹 요청을 거부하고 소유자에게 DM에서 실행하라고 요청합니다.

승인된 Codex 업로드는 Codex 앱 서버 `feedback/upload`를 호출하고,
사용 가능한 경우 나열된 각 스레드와 생성된 Codex 하위 스레드의 로그를 포함하도록
앱 서버에 요청합니다. 업로드는 Codex의 일반 피드백 경로를 통해 OpenAI
서버로 전달됩니다. 해당 앱 서버에서 Codex 피드백이 비활성화되어 있으면 명령은
앱 서버 오류를 반환합니다. 완료된 진단 응답은 전송된 스레드에 대한 채널,
OpenClaw 세션 ID, Codex 스레드 ID, 로컬 `codex resume <thread-id>`
명령을 나열합니다. 승인을 거부하거나 무시하면
OpenClaw는 해당 Codex ID를 출력하지 않습니다. 이 업로드는 로컬
Gateway 진단 내보내기를 대체하지 않습니다.

`/codex resume`은 하네스가 일반 턴에 사용하는 것과 동일한 사이드카 바인딩 파일을
작성합니다. 다음 메시지에서 OpenClaw는 해당 Codex 스레드를 다시 시작하고,
현재 선택된 OpenClaw 모델을 앱 서버로 전달하며, 확장된 기록을
활성화된 상태로 유지합니다.

### CLI에서 Codex 스레드 검사

문제가 있는 Codex 실행을 이해하는 가장 빠른 방법은 네이티브 Codex
스레드를 직접 여는 것인 경우가 많습니다.

```sh
codex resume <thread-id>
```

채널 대화에서 버그를 발견했고 문제가 있는 Codex 세션을 검사하거나,
로컬에서 계속 진행하거나, Codex가 특정 도구 또는 추론 선택을 한 이유를
묻고 싶을 때 사용하세요. 가장 쉬운 경로는 일반적으로 먼저
`/diagnostics [note]`를 실행하는 것입니다. 승인하면 완료된 보고서가
각 Codex 스레드를 나열하고 `Inspect locally` 명령을 출력합니다. 예를 들어
`codex resume <thread-id>`입니다. 이 명령을 터미널에 직접 복사할 수 있습니다.

현재 채팅의 경우 `/codex binding`에서 스레드 ID를 가져오거나,
최근 Codex 앱 서버 스레드의 경우 `/codex threads [filter]`에서 가져온 다음, 셸에서 동일한
`codex resume` 명령을 실행할 수도 있습니다.

명령 표면에는 Codex 앱 서버 `0.125.0` 이상이 필요합니다. 개별
제어 메서드는 향후 또는 사용자 지정 앱 서버가 해당 JSON-RPC 메서드를 노출하지 않는 경우
`unsupported by this Codex app-server`로 보고됩니다.

## Hook 경계

Codex 하네스에는 세 가지 Hook 계층이 있습니다.

| 계층                                  | 소유자                   | 목적                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin Hook                  | OpenClaw                 | PI 및 Codex 하네스 전반의 제품/Plugin 호환성.                      |
| Codex 앱 서버 확장 미들웨어          | OpenClaw 번들 Plugin     | OpenClaw 동적 도구 주변의 턴별 어댑터 동작.                        |
| Codex 네이티브 Hook                  | Codex                    | Codex 구성의 저수준 Codex 수명 주기 및 네이티브 도구 정책.         |

OpenClaw는 OpenClaw Plugin 동작을 라우팅하기 위해 프로젝트 또는 전역 Codex `hooks.json` 파일을
사용하지 않습니다. 지원되는 네이티브 도구 및 권한 브리지의 경우,
OpenClaw는 `PreToolUse`, `PostToolUse`,
`PermissionRequest`, `Stop`에 대한 스레드별 Codex 구성을 주입합니다. Codex 앱 서버 승인이 활성화되어 있으면
(`approvalPolicy`가 `"never"`가 아님), 기본 주입 네이티브 Hook 구성은
`PermissionRequest`를 생략하여 Codex의 앱 서버 리뷰어와 OpenClaw의 승인
브리지가 리뷰 후 실제 승격을 처리하도록 합니다. 운영자는 호환성
릴레이가 필요할 때 `nativeHookRelay.events`에 `permission_request`를 명시적으로 추가할 수 있습니다.
`SessionStart` 및 `UserPromptSubmit` 같은 다른 Codex Hook은
Codex 수준 제어로 남아 있으며, v1 계약에서 OpenClaw Plugin Hook으로 노출되지 않습니다.

OpenClaw 동적 도구의 경우, Codex가 호출을 요청한 후 OpenClaw가 도구를 실행하므로
OpenClaw는 하네스 어댑터에서 자신이 소유한 Plugin 및 미들웨어 동작을 실행합니다.
Codex 네이티브 도구의 경우, Codex가 정식 도구 기록을 소유합니다.
OpenClaw는 선택된 이벤트를 미러링할 수 있지만, Codex가 앱 서버 또는 네이티브 Hook
콜백을 통해 해당 작업을 노출하지 않는 한 네이티브 Codex
스레드를 다시 작성할 수 없습니다.

Compaction 및 LLM 수명 주기 투영은 네이티브 Codex Hook 명령이 아니라
Codex 앱 서버 알림과 OpenClaw 어댑터 상태에서 나옵니다.
OpenClaw의 `before_compaction`, `after_compaction`, `llm_input`, `llm_output`
이벤트는 어댑터 수준 관찰이며, Codex의 내부 요청 또는 Compaction 페이로드를
바이트 단위로 캡처한 것이 아닙니다.

Codex 네이티브 `hook/started` 및 `hook/completed` 앱 서버 알림은
궤적 및 디버깅을 위해 `codex_app_server.hook` 에이전트 이벤트로 투영됩니다.
이 알림은 OpenClaw Plugin Hook을 호출하지 않습니다.

## V1 지원 계약

Codex 모드는 아래에서 다른 모델 호출을 사용하는 PI가 아닙니다. Codex는
네이티브 모델 루프의 더 많은 부분을 소유하며, OpenClaw는 해당 경계 주변에
Plugin 및 세션 표면을 조정합니다.

Codex 런타임 v1에서 지원됨:

| 대상 영역                                      | 지원                                                                                 | 이유                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codex를 통한 OpenAI 모델 루프                 | 지원됨                                                                               | Codex app-server가 OpenAI 턴, 네이티브 스레드 재개, 네이티브 도구 연속 실행을 소유합니다.                                                                                                                 |
| OpenClaw 채널 라우팅 및 전달                  | 지원됨                                                                               | Telegram, Discord, Slack, WhatsApp, iMessage 및 기타 채널은 모델 런타임 밖에 유지됩니다.                                                                                                                  |
| OpenClaw 동적 도구                            | 지원됨                                                                               | Codex가 OpenClaw에 이러한 도구 실행을 요청하므로 OpenClaw는 실행 경로에 유지됩니다.                                                                                                                       |
| 프롬프트 및 컨텍스트 Plugin                   | 지원됨                                                                               | OpenClaw는 스레드를 시작하거나 재개하기 전에 프롬프트 오버레이를 빌드하고 컨텍스트를 Codex 턴에 투영합니다.                                                                                               |
| 컨텍스트 엔진 수명 주기                       | 지원됨                                                                               | Codex 턴에 대해 조립, 수집 또는 턴 이후 유지 관리, 컨텍스트 엔진 Compaction 조정이 실행됩니다.                                                                                                            |
| 동적 도구 훅                                  | 지원됨                                                                               | `before_tool_call`, `after_tool_call` 및 도구 결과 미들웨어가 OpenClaw 소유 동적 도구 주변에서 실행됩니다.                                                                                                |
| 수명 주기 훅                                  | 어댑터 관찰로 지원됨                                                                 | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, `after_compaction`이 정직한 Codex 모드 페이로드와 함께 실행됩니다.                                                                            |
| 최종 답변 수정 게이트                         | 네이티브 훅 릴레이를 통해 지원됨                                                     | Codex `Stop`은 `before_agent_finalize`로 릴레이됩니다. `revise`는 최종화 전에 Codex에 모델 패스를 한 번 더 요청합니다.                                                                                    |
| 네이티브 셸, 패치, MCP 차단 또는 관찰         | 네이티브 훅 릴레이를 통해 지원됨                                                     | Codex `PreToolUse` 및 `PostToolUse`는 Codex app-server `0.125.0` 이상에서 MCP 페이로드를 포함해 커밋된 네이티브 도구 대상 영역에 대해 릴레이됩니다. 차단은 지원되지만 인수 재작성은 지원되지 않습니다. |
| 네이티브 권한 정책                            | Codex app-server 승인 및 호환성 네이티브 훅 릴레이를 통해 지원됨                     | Codex app-server 승인 요청은 Codex 검토 후 OpenClaw를 통해 라우팅됩니다. `PermissionRequest` 네이티브 훅 릴레이는 Codex가 guardian 검토 전에 이를 내보내기 때문에 네이티브 승인 모드에서 옵트인입니다. |
| App-server 궤적 캡처                          | 지원됨                                                                               | OpenClaw는 app-server에 보낸 요청과 수신한 app-server 알림을 기록합니다.                                                                                                                                   |

Codex 런타임 v1에서 지원되지 않는 항목:

| 대상 영역                                           | V1 경계                                                                                                                                         | 향후 경로                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 네이티브 도구 인수 변경                             | Codex 네이티브 사전 도구 훅은 차단할 수 있지만, OpenClaw는 Codex 네이티브 도구 인수를 재작성하지 않습니다.                                    | 대체 도구 입력을 위한 Codex 훅/스키마 지원이 필요합니다.                                  |
| 편집 가능한 Codex 네이티브 트랜스크립트 기록        | Codex는 정식 네이티브 스레드 기록을 소유합니다. OpenClaw는 미러를 소유하고 향후 컨텍스트를 투영할 수 있지만, 지원되지 않는 내부를 변경해서는 안 됩니다. | 네이티브 스레드 수술이 필요한 경우 명시적인 Codex app-server API를 추가합니다.             |
| Codex 네이티브 도구 레코드의 `tool_result_persist`  | 이 훅은 OpenClaw 소유 트랜스크립트 쓰기를 변환하며, Codex 네이티브 도구 레코드는 변환하지 않습니다.                                           | 변환된 레코드를 미러링할 수는 있지만, 정식 재작성에는 Codex 지원이 필요합니다.             |
| 풍부한 네이티브 Compaction 메타데이터               | OpenClaw는 Compaction 시작과 완료를 관찰하지만, 안정적인 유지/삭제 목록, 토큰 델타 또는 요약 페이로드를 받지 않습니다.                       | 더 풍부한 Codex Compaction 이벤트가 필요합니다.                                            |
| Compaction 개입                                     | 현재 OpenClaw Compaction 훅은 Codex 모드에서 알림 수준입니다.                                                                                  | Plugin이 네이티브 Compaction을 거부하거나 재작성해야 하는 경우 Codex 사전/사후 Compaction 훅을 추가합니다. |
| 바이트 단위로 동일한 모델 API 요청 캡처             | OpenClaw는 app-server 요청과 알림을 캡처할 수 있지만, Codex 코어가 최종 OpenAI API 요청을 내부적으로 빌드합니다.                              | Codex 모델 요청 추적 이벤트 또는 디버그 API가 필요합니다.                                  |

## 도구, 미디어 및 Compaction

Codex 하네스는 저수준 임베디드 에이전트 실행기만 변경합니다.

OpenClaw는 계속 도구 목록을 빌드하고 하네스로부터 동적 도구 결과를 받습니다. 텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력은 계속 일반 OpenClaw 전달 경로를 통과합니다.

네이티브 훅 릴레이는 의도적으로 범용적이지만, v1 지원 계약은 OpenClaw가 테스트하는 Codex 네이티브 도구 및 권한 경로로 제한됩니다. Codex 런타임에서는 셸, 패치, MCP `PreToolUse`, `PostToolUse`, `PermissionRequest` 페이로드가 여기에 포함됩니다. 런타임 계약에서 이름을 지정하기 전까지는 향후 모든 Codex 훅 이벤트가 OpenClaw Plugin 대상 영역이라고 가정하지 마세요.

`PermissionRequest`의 경우 OpenClaw는 정책이 결정할 때만 명시적인 허용 또는 거부 결정을 반환합니다. 결정 없음 결과는 허용이 아닙니다. Codex는 이를 훅 결정 없음으로 처리하고 자체 guardian 또는 사용자 승인 경로로 넘어갑니다. Codex app-server 승인 모드는 기본적으로 이 네이티브 훅을 생략합니다. 이 문단은 `permission_request`가 `nativeHookRelay.events`에 명시적으로 포함되었거나 호환성 런타임이 이를 설치한 경우에 적용됩니다. 운영자가 Codex 네이티브 권한 요청에 대해 `allow-always`를 선택하면 OpenClaw는 제한된 세션 기간 동안 정확한 provider/session/tool input/cwd 지문을 기억합니다. 기억된 결정은 의도적으로 정확히 일치할 때만 적용됩니다. 변경된 명령, 인수, 도구 페이로드 또는 cwd는 새로운 승인을 생성합니다.

Codex MCP 도구 승인 유도는 Codex가 `_meta.codex_approval_kind`를 `"mcp_tool_call"`로 표시할 때 OpenClaw의 Plugin 승인 흐름을 통해 라우팅됩니다. Codex `request_user_input` 프롬프트는 원래 채팅으로 다시 전송되며, 다음 대기 중인 후속 메시지는 추가 컨텍스트로 조정되는 대신 해당 네이티브 서버 요청에 답합니다. 다른 MCP 유도 요청은 계속 실패 폐쇄됩니다.

활성 실행 큐 조정은 Codex app-server `turn/steer`에 매핑됩니다. 기본 `messages.queue.mode: "steer"`에서 OpenClaw는 구성된 조용한 기간 동안 대기 중인 채팅 메시지를 배치로 묶고 도착 순서대로 하나의 `turn/steer` 요청으로 전송합니다. 레거시 `queue` 모드는 별도의 `turn/steer` 요청을 보냅니다. Codex 검토 및 수동 Compaction 턴은 같은 턴 조정을 거부할 수 있으며, 이 경우 선택된 모드가 대체를 허용하면 OpenClaw는 후속 큐를 사용합니다. [스티어링 큐](/ko/concepts/queue-steering)를 참조하세요.

선택한 모델이 Codex 하네스를 사용할 때 네이티브 스레드 Compaction은 Codex app-server에 위임됩니다. OpenClaw는 채널 기록, 검색, `/new`, `/reset`, 향후 모델 또는 하네스 전환을 위해 트랜스크립트 미러를 유지합니다. 미러에는 사용자 프롬프트, 최종 어시스턴트 텍스트, app-server가 내보내는 경우 경량 Codex 추론 또는 계획 레코드가 포함됩니다. 현재 OpenClaw는 네이티브 Compaction 시작 및 완료 신호만 기록합니다. 아직 사람이 읽을 수 있는 Compaction 요약이나 Compaction 이후 Codex가 유지한 항목의 감사 가능한 목록은 노출하지 않습니다.

Codex가 정식 네이티브 스레드를 소유하므로 `tool_result_persist`는 현재 Codex 네이티브 도구 결과 레코드를 재작성하지 않습니다. 이는 OpenClaw가 OpenClaw 소유 세션 트랜스크립트 도구 결과를 작성할 때만 적용됩니다.

미디어 생성에는 PI가 필요하지 않습니다. 이미지, 비디오, 음악, PDF, TTS 및 미디어 이해는 `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, `messages.tts` 같은 일치하는 공급자/모델 설정을 계속 사용합니다.

## 문제 해결

**Codex가 일반 `/model` 공급자로 표시되지 않습니다:** 새 구성에서는 예상된 동작입니다. `agentRuntime.id: "codex"`가 있는 `openai/gpt-*` 모델 또는 레거시 `codex/*` 참조를 선택하고, `plugins.entries.codex.enabled`를 활성화한 뒤 `plugins.allow`가 `codex`를 제외하는지 확인하세요.

**OpenClaw가 Codex 대신 PI를 사용합니다:** `agentRuntime.id: "auto"`는 Codex 하네스가 실행을 주장하지 않을 때 호환성 백엔드로 여전히 PI를 사용할 수 있습니다. 테스트 중 Codex 선택을 강제하려면 `agentRuntime.id: "codex"`를 설정하세요. 강제된 Codex 런타임은 PI로 대체되는 대신 실패합니다. Codex app-server가 선택되면 해당 실패가 직접 노출됩니다.

**App-server가 거부됩니다:** app-server 핸드셰이크가 버전 `0.125.0` 이상을 보고하도록 Codex를 업그레이드하세요. 같은 버전의 프리릴리스 또는 `0.125.0-alpha.2`나 `0.125.0+custom` 같은 빌드 접미사 버전은 거부됩니다. OpenClaw가 테스트하는 안정 `0.125.0` 프로토콜 하한이 기준이기 때문입니다.

**모델 검색이 느립니다:** `plugins.entries.codex.config.discovery.timeoutMs`를 낮추거나 검색을 비활성화하세요.

**WebSocket 전송이 즉시 실패합니다:** `appServer.url`, `authToken`, 그리고 원격 app-server가 동일한 Codex app-server 프로토콜 버전을 사용하는지 확인하세요.

**비 Codex 모델이 PI를 사용합니다:** 해당 에이전트에 `agentRuntime.id: "codex"`를 강제했거나 레거시 `codex/*` 참조를 선택한 경우가 아니라면 예상된 동작입니다. 일반 `openai/gpt-*` 및 기타 공급자 참조는 `auto` 모드에서 일반 공급자 경로에 유지됩니다. `agentRuntime.id: "codex"`를 강제하면 해당 에이전트의 모든 임베디드 턴은 Codex 지원 OpenAI 모델이어야 합니다.

**Computer Use가 설치되어 있지만 도구가 실행되지 않음:** 새 세션에서
`/codex computer-use status`를 확인하세요. 도구가
`Native hook relay unavailable`를 보고하면 `/new` 또는 `/reset`을 사용하세요. 그래도 지속되면
Gateway를 재시작하여 오래된 네이티브 훅 등록을 지우세요. `computer-use.list_apps`가
시간 초과되면 Codex Computer Use 또는 Codex Desktop을 재시작하고 다시 시도하세요.

## 관련 항목

- [Agent 하네스 Plugin](/ko/plugins/sdk-agent-harness)
- [Agent 런타임](/ko/concepts/agent-runtimes)
- [모델 제공자](/ko/concepts/model-providers)
- [OpenAI 제공자](/ko/providers/openai)
- [상태](/ko/cli/status)
- [Plugin 훅](/ko/plugins/hooks)
- [구성 참조](/ko/gateway/configuration-reference)
- [테스트](/ko/help/testing-live#live-codex-app-server-harness-smoke)
