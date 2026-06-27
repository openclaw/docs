---
read_when:
    - 에이전트에 GitHub Copilot SDK 하네스를 사용하려는 경우
    - '`copilot` 런타임에 대한 구성 예제가 필요합니다'
    - 에이전트를 구독형 Copilot(github / openclaw / copilot)에 연결하고 Copilot CLI를 통해 실행하려는 경우
summary: 외부 GitHub Copilot SDK 하네스를 통해 OpenClaw 임베디드 에이전트 턴 실행
title: Copilot SDK 하네스
x-i18n:
    generated_at: "2026-06-27T17:45:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

외부 `@openclaw/copilot` Plugin을 사용하면 OpenClaw가 내장 PI 하네스 대신 GitHub Copilot CLI(`@github/copilot-sdk`)를 통해 임베디드 구독 Copilot 에이전트 턴을 실행할 수 있습니다.

Copilot CLI 세션이 저수준 에이전트 루프, 즉 네이티브 도구 실행, 네이티브 Compaction(`infiniteSessions`), `copilotHome` 아래의 CLI 관리 스레드 상태를 소유하게 하려면 Copilot SDK 하네스를 사용하세요. OpenClaw는 여전히 채팅 채널, 세션 파일, 모델 선택, OpenClaw 동적 도구(브리지됨), 승인, 미디어 전달, 표시되는 트랜스크립트 미러, `/btw` 부가 질문(트리 내 PI 폴백에서 처리됨 — [부가 질문(`/btw`)](#side-questions-btw) 참조), 그리고 `openclaw doctor`를 소유합니다.

더 넓은 모델/제공자/런타임 분리는 [에이전트 런타임](/ko/concepts/agent-runtimes)부터 시작하세요.

## 요구 사항

- `@openclaw/copilot` Plugin이 설치된 OpenClaw.
- 구성에서 `plugins.allow`를 사용하는 경우 `copilot`(Plugin이 선언한 매니페스트 id)을 포함하세요. npm 스타일 `@openclaw/copilot` 패키지 이름을 사용하는 제한적 허용 목록은 Plugin을 차단된 상태로 두며, `agentRuntime.id: "copilot"`이 있어도 런타임이 로드되지 않습니다.
- Copilot CLI를 구동할 수 있는 GitHub Copilot 구독(또는 헤드리스/Cron 실행을 위한 `gitHubToken` env / auth-profile 항목).
- 쓰기 가능한 `copilotHome` 디렉터리. 하네스는 OpenClaw가 에이전트 디렉터리를 제공하는 경우 기본값으로 `<agentDir>/copilot`을 사용하고, 그렇지 않으면 완전한 에이전트별 격리를 위해 `~/.openclaw/agents/<agentId>/copilot`을 사용합니다.

`openclaw doctor`는 선언적 세션 상태 소유권과 향후 호환성 마이그레이션을 위해 Plugin [doctor 계약](#doctor)을 실행합니다. Copilot CLI 환경 프로브는 실행하지 않습니다.

## Plugin 설치

Copilot 런타임은 외부 Plugin이므로 코어 `openclaw` 패키지는 `@github/copilot-sdk` 의존성이나 플랫폼별 `@github/copilot-<platform>-<arch>` CLI 바이너리를 포함하지 않습니다. 둘을 합치면 대략 260MB가 추가되므로, 이 런타임을 선택하는 에이전트에만 설치하세요.

```bash
openclaw plugins install @openclaw/copilot
```

마법사는 `github-copilot/*` 모델을 처음 선택하고 **동시에** 구성에서 `agentRuntime: { id: "copilot" }`을 통해 해당 모델(또는 제공자)을 Copilot 에이전트 런타임에 옵트인할 때 Plugin을 설치합니다(아래 [빠른 시작](#quickstart) 참조). 옵트인하지 않으면 openclaw는 내장 GitHub Copilot 제공자를 사용하며 런타임 Plugin을 설치하지 않습니다.

런타임은 다음 순서로 SDK를 확인합니다.

1. 설치된 `@openclaw/copilot` 패키지에서 `import("@github/copilot-sdk")`.
2. 잘 알려진 폴백 디렉터리 `~/.openclaw/npm-runtime/copilot/`(레거시 온디맨드 설치 대상).

SDK가 누락되면 코드가 `COPILOT_SDK_MISSING`인 단일 오류와 위의 Plugin 재설치 명령이 표시됩니다.

## 빠른 시작

하나의 모델(또는 하나의 제공자)을 하네스에 고정하세요.

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

두 경로는 동등합니다. 해당 모델만 하네스를 통해 라우팅해야 하는 경우 단일 모델 항목에 `agentRuntime.id`를 사용하고, 해당 제공자 아래의 모든 모델이 이를 사용해야 하는 경우 제공자에 `agentRuntime.id`를 설정하세요.

`github-copilot/auto`는 이식 가능한 시작점입니다. 이름이 지정된 Copilot 모델은 계정 및 조직 정책에 따라 달라지므로, 인증된 Copilot CLI가 해당 모델을 노출하는지 확인한 뒤에만 고정하세요.

## 지원되는 제공자

하네스는 표준 `github-copilot` 제공자(`extensions/github-copilot`이 소유한 동일한 id)에 대한 지원을 알립니다.

- `github-copilot`

또한 선택한 모델에 비어 있지 않은 `baseUrl`이 있고 다음 API 형태 중 하나를 사용하는 경우 사용자 지정 `models.providers` 항목도 지원합니다.

- `openai-responses`
- `openai-completions`
- `ollama`(OpenAI 호환 completions)
- `azure-openai-responses`
- `anthropic-messages`

`openai`, `anthropic`, `google`, `ollama` 같은 네이티브 제공자 id는 계속 네이티브 런타임이 소유합니다. Copilot BYOK를 통해 엔드포인트를 라우팅할 때는 별도의 사용자 지정 제공자 id를 사용하세요.

Copilot BYOK 엔드포인트는 공개 네트워크 HTTPS URL이어야 합니다. 하네스는 Copilot SDK에 시도별 local loopback 프록시 URL을 제공한 다음, DNS 고정과 SSRF 정책을 OpenClaw가 계속 소유하도록 OpenClaw의 보호된 fetch 경로를 통해 제공자 트래픽을 전달합니다. 로컬 Ollama, LM Studio 또는 LAN 모델 서버에는 네이티브 OpenClaw 런타임을 사용하세요.

## BYOK

Copilot BYOK는 SDK의 세션 수준 사용자 지정 제공자 계약을 사용합니다. OpenClaw는 제공자 전송 로직을 코어로 옮기지 않고 확인된 모델 엔드포인트, API 키, bearer-token 모드, 헤더, 모델 id, 컨텍스트/출력 제한을 전달합니다.

예:

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

BYOK 세션은 구독 세션 및 다른 엔드포인트나 자격 증명 지문과 별도로 키가 지정됩니다. 키, 헤더, 모델 또는 엔드포인트를 교체하면 호환되지 않는 상태를 재개하는 대신 새로운 Copilot SDK 세션이 생성됩니다.

## 인증

`runCopilotAttempt` 중 적용되는 에이전트별 우선순위:

1. 시도 입력의 **명시적 `useLoggedInUser: true`**. 에이전트의 `copilotHome` 아래에서 확인된 Copilot CLI의 로그인 사용자를 사용합니다.
2. 시도 입력의 **명시적 `gitHubToken`**(`profileId` + `profileVersion` 포함). 호출자가 auth-profile 확인을 우회하려는 직접 CLI 호출과 테스트에 유용합니다.
3. `EmbeddedRunAttemptParams` 형태의 **계약으로 확인된 `resolvedApiKey` + `authProfileId`**. 이것이 **프로덕션 주 경로**입니다. 코어는 하네스를 호출하기 전에 에이전트에 구성된 `github-copilot` auth profile을 (`src/infra/provider-usage.auth.ts:resolveProviderAuths`를 통해) 확인하고, 하네스는 두 필드를 직접 소비합니다. 이를 통해 `github-copilot:<profile>` auth profile이 env var 없이도 헤드리스/Cron/다중 프로필 설정에서 처음부터 끝까지 작동합니다.
4. auth profile이 구성되지 않은 직접 CLI/dogfood 실행을 위한 **Env-var 폴백**. 런타임은 배포된 `github-copilot` 제공자(`extensions/github-copilot/auth.ts`) 및 문서화된 Copilot SDK 설정을 반영하여 다음 var를 우선순위 순서로 확인합니다.
   1. `OPENCLAW_GITHUB_TOKEN` -- 하네스 전용 재정의입니다. 시스템 전체 `gh` / Copilot CLI 구성을 방해하지 않고 OpenClaw 하네스용 토큰을 고정하려면 이를 설정하세요.
   2. `COPILOT_GITHUB_TOKEN` -- 표준 Copilot SDK / CLI env var입니다.
   3. `GH_TOKEN` -- 표준 `gh` CLI env var입니다(기존 `github-copilot` 제공자 우선순위와 일치).
   4. `GITHUB_TOKEN` -- 일반 GitHub 토큰 폴백입니다.

   비어 있지 않은 첫 번째 값이 적용되며, 빈 문자열은 없는 것으로 처리됩니다. 합성된 풀 프로필 id는 `env:<NAME>`이고 profileVersion은 토큰의 비가역 sha256 지문이므로, env 값을 교체하면 클라이언트 풀이 깔끔하게 무효화됩니다.

5. 토큰 신호를 사용할 수 없을 때의 **기본 `useLoggedInUser`**.

각 에이전트는 전용 `copilotHome`을 받으므로 Copilot CLI 토큰, 세션, 구성이 같은 머신의 에이전트 간에 누출되지 않습니다. 기본값은 호스트가 하네스에 에이전트 디렉터리를 전달하는 경우 `<agentDir>/copilot`(동일 디렉터리의 OpenClaw `models.json` / `auth-profiles.json`에서 SDK 상태를 격리)이고, 그렇지 않으면 `~/.openclaw/agents/<agentId>/copilot`입니다. 사용자 지정 위치(예: 마이그레이션용 공유 마운트)가 필요하면 시도 입력에 `copilotHome: <path>`로 재정의하세요.

라이브 하네스 테스트는 직접 토큰이 필요할 때 `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN`을 사용합니다. 공유 라이브 테스트 설정은 실제 auth profile을 격리된 테스트 홈에 준비한 뒤 의도적으로 `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`을 제거하므로, 전용 라이브 테스트 변수를 통해 `gh auth token` 값을 전달하면 토큰을 관련 없는 스위트에 노출하지 않고도 잘못된 스킵을 피할 수 있습니다.

## 구성 표면

하네스는 시도별 입력(`runCopilotAttempt({...})`)과 `extensions/copilot/src/` 안의 작은 env 기본값 집합에서 구성을 읽습니다.

- `copilotHome` — 에이전트별 CLI 상태 디렉터리(기본값은 위에 문서화되어 있음).
- `model` — 문자열 또는 `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. 생략하면 OpenClaw는 에이전트의 일반 모델 선택을 사용하고, 하네스는 확인된 제공자가 지원되는지 검증합니다.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. `auto-reply/thinking.ts`의 OpenClaw `ThinkLevel` / `ReasoningLevel` 확인에서 매핑됩니다.
- `infiniteSessionConfig` — `harness.compact`로 구동되는 SDK `infiniteSessions` 블록에 대한 선택적 재정의입니다. 기본값은 그대로 두어도 안전합니다.
- `hooksConfig` — 도구/MCP, 사용자 프롬프트, 세션, 오류 콜백을 위한 선택적 네이티브 Copilot SDK `SessionHooks` 호환성 구성입니다. OpenClaw의 이식 가능한 수명 주기 훅과는 별개입니다.
- `permissionPolicy` — 내장 SDK 도구 종류(`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`)에 사용되는 SDK의 `onPermissionRequest` 핸들러에 대한 선택적 재정의입니다. 안전망으로 기본값은 `rejectAllPolicy`입니다. 실제로는 브리지된 모든 OpenClaw 도구가 `overridesBuiltInTool: true` 및 `skipPermission: true`로 등록되므로 SDK는 이러한 종류를 전혀 호출하지 않으며, 도구 호출의 100%가 OpenClaw의 래핑된 `execute()`를 통해 흐릅니다. [권한 및 ask_user](#permissions-and-ask_user)를 참조하세요.
- `enableSessionTelemetry` — 선택적 SDK 세션 텔레메트리 플래그입니다.

OpenClaw Plugin 훅에는 Copilot별 시도 구성이 필요하지 않습니다. 하네스는 표준 하네스 헬퍼를 통해 `before_prompt_build`(및 레거시 `before_agent_start` 호환성 훅), `llm_input`, `llm_output`, `agent_end`를 실행합니다. 성공한 SDK Compaction은 `before_compaction` 및 `after_compaction`도 실행합니다. 브리지된 OpenClaw 도구는 계속 `before_tool_call`을 실행하고 `after_tool_call`을 보고합니다. `hooksConfig`는 이식 가능한 대응 항목이 없는 네이티브 SDK 전용 콜백을 위해 남아 있습니다.

OpenClaw의 나머지 부분은 이러한 필드를 알 필요가 없습니다. 다른 Plugin, 채널, 코어 코드는 표준 `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` 형태만 봅니다.

## Compaction

`harness.compact`가 실행되면 Copilot SDK 하네스는 다음을 수행합니다.

1. 대기 중인 작업을 계속하지 않고 추적된 SDK 세션을 재개합니다.
2. SDK의 세션 범위 기록 Compaction RPC를 호출합니다.
3. 작업 공간 아래에 호환성 마커 파일을 쓰지 않고 SDK Compaction 결과를 반환합니다.

OpenClaw 측 트랜스크립트 미러(아래 참조)는 Compaction 이후 메시지를 계속 수신하므로 사용자에게 보이는 채팅 기록이 일관되게 유지됩니다.

## 트랜스크립트 미러링

`runCopilotAttempt`는 `extensions/copilot/src/dual-write-transcripts.ts`를 통해 각 턴의 미러링 가능한 메시지를 OpenClaw 감사 트랜스크립트에 이중 기록합니다. 미러는 세션별 범위(`copilot:${sessionId}`)이며 메시지별 식별자(`${role}:${sha256_16(role,content)}`)를 사용하므로 이전 턴 항목이 다시 방출되어도 기존 온디스크 키와 충돌하여 중복되지 않습니다.

미러는 트랜스크립트 쓰기 실패가 시도를 실패시키지 못하도록 두 계층의 실패 격리로 래핑됩니다. 내부 최선 노력 래퍼와 시도 수준의 방어적 `.catch(...)`입니다. 실패는 로그에 기록되지만 표면화되지 않습니다.

## 부가 질문(`/btw`)

`/btw`는 이 하니스에서 **네이티브**가 아닙니다. `createCopilotAgentHarness()`는
의도적으로 `harness.runSideQuestion`을 정의하지 않은 상태로 두므로, OpenClaw의 `/btw`
디스패처(`src/agents/btw.ts`)는 모든 비 Codex 런타임에 사용하는 것과 동일한 인트리 PI 폴백
경로로 넘어갑니다. 구성된 모델 프로바이더가 짧은 부가 질문 프롬프트로
직접 호출되고, `streamSimple`을 통해 다시 스트리밍됩니다(CLI 세션 없음, 추가 풀 슬롯 없음).

이렇게 하면 Copilot CLI 세션은 에이전트의 메인 턴 루프용으로 예약되고,
`/btw` 동작은 다른 PI 기반 런타임과 동일하게 유지됩니다. 이 계약은
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)의
`describe("runSideQuestion")` 아래에서 검증됩니다.

## Doctor

`extensions/copilot/doctor-contract-api.ts`는
`src/plugins/doctor-contract-registry.ts`에서 자동 로드됩니다. 여기에 포함되는 항목은 다음과 같습니다.

- 빈 `legacyConfigRules`(MVP에서 폐기된 필드 없음).
- 무동작 `normalizeCompatibilityConfig`(향후 필드 폐기가 안정적인 인트리 위치를 갖도록 유지).
- 프로바이더 `github-copilot`, 런타임 `copilot`, CLI 세션 키 `copilot`, 인증 프로필
  접두사 `github-copilot:`을 주장하는 `sessionRouteStateOwners` 항목 하나.

## 제한 사항

- 이 하니스는 `github-copilot` 및 소유자가 없는 사용자 지정 BYOK 프로바이더 ID를 주장합니다.
  매니페스트가 소유한 네이티브 프로바이더 ID는 `agentRuntime.id`가 `copilot`으로 강제되더라도
  해당 소유 런타임에 남습니다.
- 이 하니스는 TUI를 제공하지 않습니다. PI의 TUI는 영향을 받지 않으며 피어 표면이 없는
  모든 런타임의 폴백으로 유지됩니다.
- 에이전트가 `copilot`으로 전환될 때 PI 세션 상태는 마이그레이션되지 않습니다.
  선택은 시도별로 이루어지며, 기존 PI 세션은 계속 유효합니다.
- `ask_user`는 Codex 하니스와 동일한 OpenClaw 프롬프트-응답 경로를 사용합니다.
  Copilot SDK가 사용자 입력을 요청하면 OpenClaw는 활성 채널/TUI에
  차단 프롬프트를 게시하고, 다음 대기열 사용자 메시지가 SDK 요청을 해결합니다.

## 권한 및 ask_user

브리지된 OpenClaw 도구의 권한 강제는 SDK의 `onPermissionRequest` 콜백이 아니라
**도구 래퍼 내부**에서 발생합니다. PI가 사용하는 것과 동일한
`wrapToolWithBeforeToolCallHook`(`src/agents/pi-tools.before-tool-call.ts`)이
`createOpenClawCodingTools`에 의해 모든 코딩 도구에 적용됩니다. 루프 감지,
신뢰할 수 있는 Plugin 정책, before-tool-call 훅, Gateway를 통한 2단계 Plugin 승인
(`plugin.approval.request`)이 모두 네이티브 PI 시도와 정확히 동일한 코드 경로로 실행됩니다.

해당 래퍼가 결정을 소유할 수 있도록 `convertOpenClawToolToSdkTool`이 반환하는 SDK Tool에는
다음이 표시됩니다.

- `overridesBuiltInTool: true` — 같은 이름의 Copilot CLI 내장 도구(edit, read, write, bash, …)를
  대체하여 모든 도구 호출이 OpenClaw로 다시 라우팅되도록 합니다.
- `skipPermission: true` — 도구를 호출하기 전에 SDK가
  `onPermissionRequest({kind: "custom-tool"})`를 발생시키지 않도록 지시합니다.
  래핑된 `execute()`는 더 풍부한 OpenClaw 정책 검사를 내부적으로 수행합니다. SDK 수준 프롬프트는
  (모두 허용할 경우) OpenClaw의 강제를 우회하거나, (모두 거부할 경우) 모든 도구 호출을
  차단하게 되며, 둘 다 PI와의 동등성에 맞지 않습니다.

인트리 codex 하니스도 동일한 분리를 사용합니다. 브리지된 OpenClaw 도구는
래핑되고(`extensions/codex/src/app-server/dynamic-tools.ts`), codex-app-server의 _자체_
네이티브 승인 종류(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`)는
`plugin.approval.request`
(`extensions/codex/src/app-server/approval-bridge.ts`)를 통해 라우팅됩니다. 이에 해당하는
Copilot SDK 방식, 즉 `onPermissionRequest`에 도달하는 모든 비 `custom-tool` 종류에 대한
fail-closed `rejectAllPolicy`는 동일한 안전망이며, `overridesBuiltInTool: true`가
모든 내장 도구를 대체하므로 실제로는 발생하지 않습니다.

래핑된 도구 계층이 PI와 동등한 정책 결정을 내리도록 하려면, 하니스는 전체 PI 시도 도구 컨텍스트를
`createOpenClawCodingTools`로 전달합니다. 여기에는 신원(`senderIsOwner`,
`memberRoleIds`, `ownerOnlyToolAllowlist`, …), 채널/라우팅
(`groupId`, `currentChannelId`, `replyToMode`, 메시지 도구 토글), 인증(`authProfileStore`),
실행 신원(`sandboxSessionKey`에서 파생된 `sessionKey`/`runSessionKey`, `runId`),
모델 컨텍스트(`modelApi`, `modelContextWindowTokens`, `modelCompat`, `modelHasVision`),
실행 훅(`onToolOutcome`, `onYield`)이 포함됩니다. 이러한 필드가 없으면 소유자 전용 허용 목록은
조용히 기본 거부처럼 동작하고, Plugin 신뢰 정책은 올바른 스코프로 해석될 수 없으며,
`session_status: "current"`는 오래된 샌드박스 키로 해석됩니다. 브리지 빌더는
`extensions/copilot/src/tool-bridge.ts`에 있으며, PI의 권위 있는 호출
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117`을 미러링합니다. `runAttempt`는 이미
공유 `resolveSandboxContext` 연결부를 통해 샌드박스 컨텍스트를 해석하고, SDK에 유효 작업 디렉터리를
전달하며, `sandbox`와 하위 에이전트 생성 작업공간을 도구 브리지로 전달합니다. 또한 브리지는
SDK 경계에서 강제할 수 있는 제한된 도구 구성 제어(`includeCoreTools`, 런타임 도구 허용 목록,
`toolConstructionPlan`)도 전달합니다.

브리지는 PI 동등성을 위해 `openclaw/plugin-sdk/agent-harness-tool-runtime`의 공유 하니스 도구 표면 헬퍼도 사용합니다.
도구 검색이 활성화되면 SDK는 모든 OpenClaw 도구 스키마 대신 간결한 제어 도구와 숨겨진 카탈로그 실행기를 봅니다.
코드 모드가 활성화되면 헬퍼는 다른 에이전트 하니스에서 사용하는 것과 동일한 코드 모드 제어 표면 및 카탈로그 수명 주기를 빌드합니다.
로컬 모델 린 기본값, 런타임 호환 스키마 필터링, 디렉터리 하이드레이션, 카탈로그 정리는 모두 공유 헬퍼에 남아
Copilot과 Codex 인접 하니스가 서로 달라지지 않도록 합니다.

### 세션 수준 GitHub 토큰

Copilot SDK 계약은 **클라이언트 수준** GitHub 토큰
(`CopilotClientOptions.gitHubToken`, CLI 프로세스 자체 인증에 사용)과 **세션 수준** 토큰
(`SessionConfig.gitHubToken`, 해당 세션의 콘텐츠 제외, 모델 라우팅, 할당량을 결정하며
`createSession`과 `resumeSession` 모두에서 적용됨)을 구분합니다. 하니스는
`resolveCopilotAuth`를 통해 인증을 한 번 해석하고, 인증 모드가 `gitHubToken`일 때
두 필드를 모두 설정합니다(명시적 `auth.gitHubToken` 또는 구성된 `github-copilot` 인증 프로필에서
계약에 따라 해석된 `resolvedApiKey`). 해석된 모드가 `useLoggedInUser`이면 SDK가 로그인된
신원에서 계속 신원을 파생하도록 세션 수준 필드는 생략됩니다.

`ask_user`는 `SessionConfig.onUserInputRequest`를 사용합니다. 브리지는 고정 선택 요청에 대해
선택지 인덱스 또는 레이블을 허용하고, SDK 요청이 허용하는 경우 자유 형식 답변을 허용하며,
OpenClaw 시도가 중단되면 대기 중인 요청을 취소합니다.

## 관련 항목

- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [Codex 하니스](/ko/plugins/codex-harness)
- [에이전트 하니스 Plugin(SDK 참조)](/ko/plugins/sdk-agent-harness)
