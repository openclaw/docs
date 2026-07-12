---
read_when:
    - 에이전트에 GitHub Copilot SDK 하네스를 사용하려는 경우
    - '`copilot` 런타임의 구성 예제가 필요합니다'
    - 에이전트를 구독형 Copilot(github / openclaw / copilot)에 연결하고 Copilot CLI를 통해 실행하려고 합니다.
summary: 외부 GitHub Copilot SDK 하니스를 통해 OpenClaw 임베디드 에이전트 턴 실행
title: Copilot SDK 하네스
x-i18n:
    generated_at: "2026-07-12T00:56:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

외부 `@openclaw/copilot` Plugin은 OpenClaw의 내장 하네스 대신 GitHub Copilot CLI(`@github/copilot-sdk`)를 통해 내장형 구독 Copilot 에이전트 턴을 실행합니다. Copilot CLI 세션은 네이티브 도구 실행, 네이티브 Compaction(`infiniteSessions`), `copilotHome` 아래에서 CLI가 관리하는 스레드 상태 등 저수준 에이전트 루프를 소유합니다. OpenClaw는 계속해서 채팅 채널, 세션 파일, 모델 선택, 동적 도구(브리지됨), 승인, 미디어 전달, 표시되는 트랜스크립트 미러, `/btw` 부가 질문([부가 질문(`/btw`)](#side-questions-btw) 참조), `openclaw doctor`를 소유합니다.

더 광범위한 모델/제공자/런타임 분리에 대해서는 [에이전트 런타임](/ko/concepts/agent-runtimes)부터 참조하세요.

## 요구 사항

- `@openclaw/copilot` Plugin이 설치된 OpenClaw.
- 구성에서 `plugins.allow`를 사용하는 경우 `copilot`(Plugin이 선언하는 매니페스트 ID)을 포함하세요. npm 패키지 이름 `@openclaw/copilot`을 허용 목록에 넣어도 일치하지 않으므로 `agentRuntime.id: "copilot"`을 설정했더라도 Plugin이 차단된 상태로 유지됩니다.
- Copilot CLI를 구동할 수 있는 GitHub Copilot 구독 또는 헤드리스나 Cron 실행을 위한 `gitHubToken` 환경 변수/인증 프로필 항목.
- 쓰기 가능한 `copilotHome` 디렉터리. OpenClaw가 에이전트 디렉터리를 제공하면 기본값은 `<agentDir>/copilot`이고, 그렇지 않으면 `~/.openclaw/agents/<agentId>/copilot`입니다.

`openclaw doctor`는 세션 상태 소유권과 향후 구성 마이그레이션을 위해 Plugin의 [doctor 계약](#doctor)을 실행합니다. Copilot CLI 환경은 검사하지 않습니다.

## 설치

Copilot 런타임은 외부 Plugin으로 제공되므로 핵심 `openclaw` 패키지는 `@github/copilot-sdk` 또는 플랫폼별 `@github/copilot-<platform>-<arch>` CLI 바이너리(합계 약 260MB)를 포함하지 않습니다. 이 런타임을 사용하도록 선택한 에이전트에만 설치하세요.

```bash
openclaw plugins install @openclaw/copilot
```

설정 마법사는 `github-copilot/*` 모델을 처음 선택하고 **동시에** 구성에서 `agentRuntime: { id: "copilot" }`을 통해 해당 모델(또는 제공자)을 Copilot 런타임으로 라우팅할 때 Plugin을 자동으로 설치합니다. [빠른 시작](#quickstart)을 참조하세요. 이 명시적 선택이 없으면 OpenClaw는 내장 GitHub Copilot 제공자를 사용하며 이 Plugin을 설치하지 않습니다.

런타임은 다음 순서로 SDK를 확인합니다.

1. 설치된 `@openclaw/copilot` 패키지에서 `import("@github/copilot-sdk")`.
2. 대체 디렉터리 `~/.openclaw/npm-runtime/copilot/`(레거시 온디맨드 설치 대상).

SDK가 없으면 코드가 `COPILOT_SDK_MISSING`인 단일 오류와 위 재설치 명령이 표시됩니다.

## 빠른 시작

하나의 모델(또는 하나의 제공자)을 하네스에 고정합니다.

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

단일 모델 항목에 `agentRuntime.id`를 설정하면 해당 모델만 하네스를 통해 라우팅하고, 제공자에 설정하면 해당 제공자의 모든 모델을 라우팅합니다.

`github-copilot/auto`가 이식 가능한 시작점입니다. 이름이 지정된 Copilot 모델은 계정 및 조직 정책에 따라 달라집니다. 모델을 고정하기 전에 인증된 Copilot CLI에서 해당 모델이 실제로 노출되는지 확인하세요.

## 지원되는 제공자

하네스는 정규 `github-copilot` 제공자(`extensions/github-copilot` 소유)와 모델에 비어 있지 않은 `baseUrl` 및 다음 `api` 형식 중 하나가 있는 경우 사용자 지정 `models.providers` 항목을 지원합니다.

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`(OpenAI 호환 완성)
- `openai-completions`
- `openai-responses`

네이티브 제공자 ID(`openai`, `anthropic`, `google`, `ollama`)는 계속 각 네이티브 런타임이 소유합니다. 대신 Copilot BYOK를 통해 엔드포인트를 라우팅하려면 별도의 사용자 지정 제공자 ID를 사용하세요.

Copilot BYOK 엔드포인트는 공개 HTTPS URL이어야 합니다. 하네스는 시도별 로컬 루프백 프록시를 Copilot SDK에 제공한 다음, DNS 고정 및 SSRF 정책을 OpenClaw가 계속 소유하도록 제공자 트래픽을 OpenClaw의 보호된 가져오기 경로를 통해 전달합니다. 로컬 Ollama, LM Studio 또는 LAN 모델 서버에는 네이티브 OpenClaw 런타임을 사용하세요.

## BYOK

Copilot BYOK는 SDK의 세션 수준 사용자 지정 제공자 계약을 사용합니다. OpenClaw는 확인된 모델 엔드포인트, API 키, 전달자 토큰 모드, 헤더, 모델 ID, 컨텍스트/출력 제한을 전달하며 제공자 전송 로직은 핵심이 아닌 SDK에 유지됩니다.

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

BYOK 세션은 구독 세션 및 다른 BYOK 엔드포인트나 자격 증명과 별도로 키가 지정됩니다. 키, 헤더, 모델 또는 엔드포인트를 교체하면 호환되지 않는 상태를 재개하는 대신 새로운 Copilot SDK 세션이 시작됩니다.

## 인증

`runCopilotAttempt` 중 에이전트별로 적용되는 우선순위는 다음과 같습니다.

1. 시도 입력의 **명시적 `useLoggedInUser: true`** — 에이전트의 `copilotHome` 아래에서 Copilot CLI에 로그인한 사용자를 사용합니다.
2. 시도 입력의 **명시적 `gitHubToken`**(`profileId` + `profileVersion` 필요). 인증 프로필 확인을 우회해야 하는 직접 CLI 호출과 테스트를 위한 항목입니다.
3. **계약으로 확인된 `resolvedApiKey` + `authProfileId`** — 프로덕션의 주 경로입니다. 핵심은 하네스를 호출하기 전에 에이전트에 구성된 `github-copilot` 인증 프로필(`src/infra/provider-usage.auth.ts:resolveProviderAuths`)을 확인하므로, `github-copilot:<profile>` 인증 프로필은 환경 변수 없이도 헤드리스, Cron 또는 다중 프로필 설정에서 처음부터 끝까지 작동합니다.
4. **환경 변수 대체 경로**. 다음 순서로 확인합니다(비어 있지 않은 첫 번째 값이 사용되며 빈 문자열은 없는 것으로 간주합니다. `extensions/github-copilot/auth.ts`에 제공된 `github-copilot` 제공자의 우선순위를 따릅니다).
   1. `OPENCLAW_GITHUB_TOKEN` — 하네스 전용 재정의입니다. 시스템 전체의 `gh`/Copilot CLI 구성을 방해하지 않고 OpenClaw 하네스의 토큰을 고정할 수 있습니다.
   2. `COPILOT_GITHUB_TOKEN` — 표준 Copilot SDK/CLI 환경 변수.
   3. `GH_TOKEN` — 표준 `gh` CLI 환경 변수.
   4. `GITHUB_TOKEN` — 일반 GitHub 토큰 대체 경로.

   합성된 풀 프로필 ID는 `env:<NAME>`이며 프로필 버전은 토큰의 비가역적 sha256 지문입니다. 따라서 환경 변수 값을 교체하면 클라이언트 풀이 깔끔하게 무효화됩니다.

5. 토큰 신호가 없을 때의 **기본 `useLoggedInUser`**.

각 에이전트는 자체 `copilotHome`을 사용하므로 Copilot CLI 토큰, 세션, 구성이 동일한 머신의 에이전트 간에 유출되지 않습니다. 기본값은 `<agentDir>/copilot`(SDK 상태를 OpenClaw의 `models.json`/`auth-profiles.json`과 동일한 디렉터리 외부에 유지)이며 에이전트 디렉터리가 제공되지 않으면 `~/.openclaw/agents/<agentId>/copilot`입니다. 사용자 지정 위치(예: 마이그레이션용 공유 마운트)를 사용하려면 시도 입력에서 `copilotHome: <path>`로 재정의하세요.

실시간 하네스 테스트는 직접 토큰에 `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN`을 사용합니다. 공유 실시간 테스트 설정은 실제 인증 프로필을 격리된 테스트 홈에 준비한 후 `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`을 제거하므로, 전용 변수를 통해 전달된 `gh auth token` 값은 관련 없는 테스트 모음으로 유출되지 않으면서 잘못된 건너뛰기를 방지합니다.

## 구성 표면

하네스는 시도별 입력(`runCopilotAttempt({...})`)과 `extensions/copilot/src/` 내부의 소수 환경 변수 기본값에서 구성을 읽습니다.

| 필드                     | 목적                                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `copilotHome`            | 에이전트별 CLI 상태 디렉터리(기본값은 위 참조).                                                                                                                                                                                                                                                                                      |
| `model`                  | 문자열 또는 `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. 에이전트의 일반 모델 선택을 사용하려면 생략하세요. 하네스는 확인된 제공자가 지원되는지 검증합니다.                                                                                                                                                                |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. `auto-reply/thinking.ts`에서 OpenClaw의 `ThinkLevel`/`ReasoningLevel` 확인 결과로부터 매핑됩니다.                                                                                                                                                                                           |
| `infiniteSessionConfig`  | `harness.compact`가 구동하는 SDK `infiniteSessions` 블록의 선택적 재정의입니다. 그대로 두어도 안전합니다.                                                                                                                                                                                                                              |
| `hooksConfig`            | 도구/MCP, 사용자 프롬프트, 세션, 오류 콜백을 위한 선택적 네이티브 Copilot SDK `SessionHooks` 구성입니다. OpenClaw의 이식 가능한 수명 주기 훅과는 별개입니다.                                                                                                                                                                           |
| `permissionPolicy`       | 내장 SDK 도구 종류(`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`)에 대한 SDK의 `onPermissionRequest` 처리기의 선택적 재정의입니다. 안전망으로 기본값은 `rejectAllPolicy`입니다. 실제로 호출되지 않는 이유는 [권한과 ask_user](#permissions-and-ask_user)를 참조하세요. |
| `enableSessionTelemetry` | 선택적 SDK 세션 원격 측정 플래그입니다.                                                                                                                                                                                                                                                                                              |

OpenClaw Plugin 훅에는 Copilot 전용 시도 구성이 필요하지 않습니다. 하네스는 표준 하네스 도우미를 통해 `before_prompt_build`(및 레거시 `before_agent_start` 호환성 훅), `llm_input`, `llm_output`, `agent_end`를 실행합니다. 성공한 SDK Compaction은 `before_compaction` 및 `after_compaction`도 실행합니다. 브리지된 OpenClaw 도구는 `before_tool_call`을 실행하고 `after_tool_call`을 보고합니다. `hooksConfig`는 이식 가능한 동등 항목이 없는 네이티브 SDK 전용 콜백에 계속 사용됩니다.

OpenClaw의 다른 어떤 부분도 이러한 필드를 알 필요가 없습니다. 다른 Plugin, 채널, 핵심 코드는 표준 `AgentHarnessAttemptParams`/`AgentHarnessAttemptResult` 형식만 봅니다.

## Compaction

`harness.compact`가 실행되면 Copilot SDK 하네스는 다음을 수행합니다.

1. 대기 중인 작업을 계속하지 않고 추적된 SDK 세션을 재개합니다.
2. SDK의 세션 범위 기록 Compaction RPC를 호출합니다.
3. 작업 공간 아래에 호환성 마커 파일을 쓰지 않고 SDK Compaction 결과를 반환합니다.

OpenClaw 측 트랜스크립트 미러(아래)는 Compaction 이후 메시지를 계속 수신하므로 사용자에게 표시되는 채팅 기록의 일관성이 유지됩니다.

## 트랜스크립트 미러링

`runCopilotAttempt`는 `extensions/copilot/src/dual-write-transcripts.ts`를 통해 각 턴에서 미러링 가능한 메시지를 OpenClaw 감사 트랜스크립트에도 함께 기록합니다. 미러는 세션별(`copilot:${sessionId}`)로 범위가 지정되고 메시지별(`${role}:${sha256_16(role,content)}`)로 키가 지정되므로, 다시 내보낸 이전 턴 항목은 중복되지 않고 기존 디스크 키와 충돌합니다.

미러는 두 계층의 장애 격리로 감싸져 있어 트랜스크립트 쓰기 실패가
시도 자체를 실패시키지 않습니다. 내부의 최선형 래퍼와 시도 수준의
심층 방어용 `.catch(...)`가 함께 적용됩니다. 실패는 로그에 기록되며
외부로 노출되지 않습니다.

## 보조 질문 (`/btw`)

이 하네스에서 `/btw`는 네이티브 기능이 **아닙니다**. `createCopilotAgentHarness()`는
의도적으로 `harness.runSideQuestion`을 정의하지 않은 상태로 둡니다
(`extensions/copilot/harness.test.ts`의 `describe("runSideQuestion")`에서 검증).
따라서 OpenClaw의 `/btw` 디스패처(`src/agents/btw.ts`)는 Codex 이외의 모든
런타임에 사용하는 것과 같은 경로로 대체됩니다. 구성된 모델 제공자를
짧은 보조 질문 프롬프트와 함께 직접 호출하고 `streamSimple`을 통해
스트리밍으로 반환합니다(CLI 세션과 추가 풀 슬롯은 사용하지 않음).

이렇게 하면 Copilot CLI 세션은 에이전트의 기본 턴 루프 전용으로 유지되고,
`/btw` 동작도 Codex 이외의 다른 런타임과 동일하게 유지됩니다.

## 진단

`extensions/copilot/doctor-contract-api.ts`는
`src/plugins/doctor-contract-registry.ts`에서 자동으로 로드됩니다. 다음 항목을 제공합니다.

- 비어 있는 `legacyConfigRules`(아직 폐기된 필드 없음).
- 아무 작업도 하지 않는 `normalizeCompatibilityConfig`(향후 필드 폐기 시
  트리 내부에서 사용할 안정적인 위치를 제공하기 위해 유지).
- 하나의 `sessionRouteStateOwners` 항목: 제공자 `github-copilot`, 런타임
  `copilot`, CLI 세션 키 `copilot`, 인증 프로필 접두사 `github-copilot:`.

## 제한 사항

- 하네스는 `github-copilot`과 소유자가 지정되지 않은 사용자 정의 BYOK 제공자 ID를
  담당합니다. 매니페스트가 소유한 네이티브 제공자 ID는 `agentRuntime.id`가
  `copilot`으로 강제되어도 해당 소유 런타임에 유지됩니다.
- TUI 표면은 없습니다. 동등한 표면이 없는 런타임에서는 PI의 TUI가 계속
  대체 수단으로 사용됩니다.
- 에이전트가 `copilot`으로 전환해도 PI 세션 상태는 마이그레이션되지 않습니다.
  선택은 시도별로 이루어지며 기존 PI 세션은 계속 유효합니다.
- `ask_user`는 Codex 하네스와 동일한 OpenClaw 프롬프트 및 응답 경로를 사용합니다.
  Copilot SDK가 사용자 입력을 요청하면 OpenClaw가 활성 채널/TUI에
  차단형 프롬프트를 게시하고, 다음으로 대기열에 들어온 사용자 메시지가
  SDK 요청을 해결합니다.

## 권한 및 ask_user

브리지된 OpenClaw 도구의 권한 적용은 SDK의 `onPermissionRequest` 콜백이 아니라
**도구 래퍼 내부**에서 이루어집니다. PI가 사용하는 것과 동일한
`wrapToolWithBeforeToolCallHook`
(`src/agents/agent-tools.before-tool-call.ts`)가
`createOpenClawCodingTools`를 통해 모든 코딩 도구에 적용됩니다. 루프 감지,
신뢰할 수 있는 Plugin 정책, 도구 호출 전 훅, Gateway를 통한 2단계 Plugin 승인
(`plugin.approval.request`)이 모두 네이티브 PI 시도와 정확히 동일한 코드
경로를 거칩니다.

`convertOpenClawToolToSdkTool`이 반환하는 SDK 도구에는 다음 설정이 지정됩니다.

- `overridesBuiltInTool: true` — 같은 이름의 Copilot CLI 내장 도구
  (edit, read, write, bash, ...)를 대체하여 모든 도구 호출이 OpenClaw로
  다시 라우팅되도록 합니다.
- `skipPermission: true` — 도구를 호출하기 전에 SDK가
  `onPermissionRequest({kind: "custom-tool"})`를 실행하지 않도록 합니다.
  래핑된 `execute()`가 이미 더 정교한 OpenClaw 정책 검사를 수행합니다.
  SDK 수준 프롬프트는 OpenClaw의 적용을 우회하거나(모두 허용) 모든 도구 호출을
  차단하게 되며(모두 거부), 어느 쪽도 PI와의 동등성에 부합하지 않습니다.

트리 내부 Codex 하네스도 동일한 분리를 사용합니다. 브리지된 OpenClaw 도구는
래핑되며(`extensions/codex/src/app-server/dynamic-tools.ts`),
codex-app-server 자체의 네이티브 승인 종류
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`)는
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`)를 통해 라우팅됩니다.
이에 대응하는 Copilot SDK 방식은 `onPermissionRequest`에 도달하는
`custom-tool` 이외의 모든 종류에 대해 폐쇄적으로 실패하는 `rejectAllPolicy`를
적용하는 것입니다. 이는 동일한 안전망이며, `overridesBuiltInTool: true`가
모든 내장 도구를 대체하므로 실제로 실행되는 일은 없습니다.

래핑된 도구 계층이 PI와 동등한 정책 결정을 내릴 수 있도록 하네스는 전체 PI
시도 도구 컨텍스트를 `createOpenClawCodingTools`로 전달합니다. 여기에는
ID 정보(`senderIsOwner`, `memberRoleIds`, `ownerOnlyToolAllowlist`, ...),
채널/라우팅(`groupId`, `currentChannelId`, `replyToMode`, 메시지 도구 토글),
인증(`authProfileStore`), 실행 ID(`sandboxSessionKey`에서 파생된
`sessionKey` / `runSessionKey`, `runId`), 모델 컨텍스트(`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`), 실행 훅
(`onToolOutcome`, `onYield`)이 포함됩니다. 이러한 필드가 없으면 소유자 전용
허용 목록이 기본적으로 아무 알림 없이 거부하고, Plugin 신뢰 정책은 올바른
범위를 확인할 수 없으며, `session_status: "current"`는 오래된 샌드박스 키로
해석됩니다. 브리지 빌더는 `extensions/copilot/src/tool-bridge.ts`에 있으며,
`src/agents/embedded-agent-runner/run/attempt.ts:1262`의 PI 기준 호출을
그대로 따릅니다. `runAttempt`는 공유 `resolveSandboxContext` 경로를 통해
샌드박스 컨텍스트를 확인하고, SDK에 유효 작업 디렉터리를 전달하며,
`sandbox`와 하위 에이전트 생성 작업 공간을 도구 브리지로 전달합니다.
또한 브리지는 SDK 경계에서 적용할 수 있는 제한된 도구 구성 제어 항목인
`includeCoreTools`, 런타임 도구 허용 목록, `toolConstructionPlan`도 전달합니다.

브리지는 PI와의 동등성을 위해
`openclaw/plugin-sdk/agent-harness-tool-runtime`의 공유 하네스 도구 표면
도우미도 사용합니다. 도구 검색이 활성화되면 SDK에는 모든 OpenClaw 도구
스키마 대신 간결한 제어 도구와 숨겨진 카탈로그 실행기가 제공됩니다.
코드 모드가 활성화되면 도우미가 다른 에이전트 하네스에서 사용하는 것과 동일한
코드 모드 제어 표면과 카탈로그 수명 주기를 구성합니다. 로컬 모델용 간소화된
기본값, 런타임 호환 스키마 필터링, 디렉터리 하이드레이션, 카탈로그 정리는
모두 공유 도우미에 유지되어 Copilot과 Codex 인접 하네스 간에 차이가 생기지
않도록 합니다.

### 세션 수준 GitHub 토큰

Copilot SDK 계약은 **클라이언트 수준** GitHub 토큰
(`CopilotClientOptions.gitHubToken`, CLI 프로세스 자체를 인증)과
**세션 수준** 토큰(`SessionConfig.gitHubToken`, 해당 세션의 콘텐츠 제외,
모델 라우팅, 할당량을 결정하며 `createSession`과 `resumeSession` 모두에서
적용됨)을 구분합니다. 하네스는 `resolveCopilotAuth`를 통해 인증을 한 번
확인하고, 인증 모드가 `gitHubToken`이면 두 필드를 모두 설정합니다.
여기에는 명시적인 `auth.gitHubToken` 또는 구성된 `github-copilot` 인증
프로필에서 계약에 따라 확인된 `resolvedApiKey`가 해당됩니다. 확인된 모드가
`useLoggedInUser`이면 SDK가 로그인된 ID에서 계속 ID 정보를 파생하도록
세션 수준 필드를 생략합니다.

`ask_user`는 `SessionConfig.onUserInputRequest`를 사용합니다. 브리지는
고정 선택 요청에 대해 선택 항목의 인덱스나 레이블을 허용하고, SDK 요청에서
허용하는 경우 자유 형식 응답을 허용하며, OpenClaw 시도가 중단되면 대기 중인
요청을 취소합니다.

## 관련 문서

- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [Codex 하네스](/ko/plugins/codex-harness)
- [에이전트 하네스 Plugin(SDK 참조)](/ko/plugins/sdk-agent-harness)
