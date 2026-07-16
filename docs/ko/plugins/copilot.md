---
read_when:
    - 에이전트에 GitHub Copilot SDK 하네스를 사용하려고 합니다
    - '`copilot` 런타임의 구성 예제가 필요합니다'
    - 에이전트를 구독형 Copilot(github / openclaw / copilot)에 연결하고 Copilot CLI를 통해 실행하려고 합니다.
summary: 외부 GitHub Copilot SDK 하네스를 통해 OpenClaw 임베디드 에이전트 턴을 실행합니다
title: Copilot SDK 하네스
x-i18n:
    generated_at: "2026-07-16T12:51:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

외부 `@openclaw/copilot` Plugin은 OpenClaw의 내장 하네스 대신 GitHub Copilot CLI(`@github/copilot-sdk`)를 통해 내장 구독 Copilot
에이전트 턴을 실행합니다. Copilot CLI 세션은 저수준
에이전트 루프를 소유합니다. 즉, 네이티브 도구 실행, 네이티브 Compaction(`infiniteSessions`), 그리고
`copilotHome` 아래에서 CLI가 관리하는 스레드 상태를 담당합니다. OpenClaw는 여전히 채팅
채널, 세션 파일, 모델 선택, 동적 도구(브리지됨), 승인,
미디어 전송, 표시되는 트랜스크립트 미러, `/btw` 부가 질문([부가 질문(`/btw`)](#side-questions-btw) 참조),
그리고 `openclaw doctor`을 소유합니다.

더 광범위한 모델/제공자/런타임 분리에 대해서는
[에이전트 런타임](/ko/concepts/agent-runtimes)부터 확인하십시오.

## 요구 사항

- `@openclaw/copilot` Plugin이 설치된 OpenClaw.
- 구성에서 `plugins.allow`을 사용하는 경우 `copilot`(Plugin이
  선언하는 매니페스트 ID)을 포함하십시오. npm 패키지 이름
  `@openclaw/copilot`의 허용 목록 항목은 일치하지 않으며,
  `agentRuntime.id: "copilot"`이 설정되어 있어도 Plugin이 차단된 상태로 남습니다.
- Copilot CLI를 구동할 수 있는 GitHub Copilot 구독 또는
  헤드리스나 Cron 실행을 위한 `gitHubToken` 환경 변수/인증 프로필 항목.
- 쓰기 가능한 `copilotHome` 디렉터리. OpenClaw가 에이전트 디렉터리를
  제공하는 경우 기본값은 `<agentDir>/copilot`이며, 그렇지 않으면
  `~/.openclaw/agents/<agentId>/copilot`입니다.

`openclaw doctor`은 세션 상태 소유권 및 향후 구성 마이그레이션을 위한
Plugin의 [doctor 계약](#doctor)을 실행합니다. Copilot CLI 환경은
검사하지 않습니다.

## 설치

Copilot 런타임은 외부 Plugin으로 제공되므로 코어 `openclaw`
패키지에 `@github/copilot-sdk` 또는 플랫폼별
`@github/copilot-<platform>-<arch>` CLI 바이너리(합계 약 260 MB)가 포함되지 않습니다.
이 런타임을 사용하도록 선택한 에이전트에만 설치하십시오.

```bash
openclaw plugins install @openclaw/copilot
```

설정 마법사는 `github-copilot/*` 모델을 처음 선택하고 **동시에**
구성에서 `agentRuntime: { id: "copilot" }`을 통해 해당 모델(또는 그 제공자)을 Copilot 런타임으로
라우팅하면 Plugin을 자동으로 설치합니다. [빠른 시작](#quickstart)을 참조하십시오.
이 옵트인이 없으면 OpenClaw는 내장 GitHub Copilot 제공자를 사용하며
이 Plugin을 설치하지 않습니다.

런타임은 다음 순서로 SDK를 확인합니다.

1. 설치된 `@openclaw/copilot`
   패키지의 `import("@github/copilot-sdk")`.
2. 대체 디렉터리 `~/.openclaw/npm-runtime/copilot/`(레거시 주문형
   설치 대상).

SDK가 없으면 코드가 `COPILOT_SDK_MISSING`인 단일 오류와 위의
재설치 명령이 표시됩니다.

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

단일 모델 항목에 `agentRuntime.id`을 설정하면 해당 모델만
하네스를 통해 라우팅하며, 제공자에 설정하면 해당 제공자의 모든 모델을 라우팅합니다.

`github-copilot/auto`은 이식 가능한 시작점입니다. 명명된 Copilot 모델은
계정 및 조직 정책에 따라 달라집니다. 고정하기 전에 인증된
Copilot CLI에서 실제로 해당 모델을 제공하는지 확인하십시오.

## 지원되는 제공자

하네스는 `extensions/github-copilot`이 소유하는 표준 `github-copilot`
제공자와, 모델에 비어 있지 않은 `baseUrl` 및 다음 `api`
형식 중 하나가 있는 사용자 지정 `models.providers` 항목을 지원합니다.

- `anthropic-messages`
- `azure-openai-responses`
- `ollama`(OpenAI 호환 완성)
- `openai-completions`
- `openai-responses`

네이티브 제공자 ID(`openai`, `anthropic`, `google`, `ollama`)는 해당
네이티브 런타임이 계속 소유합니다. 대신 Copilot BYOK를 통해 엔드포인트를
라우팅하려면 별도의 사용자 지정 제공자 ID를 사용하십시오.

Copilot BYOK 엔드포인트는 공개 HTTPS URL이어야 합니다. 하네스는
시도별 루프백 프록시를 Copilot SDK에 제공한 다음, 제공자 트래픽을
OpenClaw의 보호된 fetch 경로를 통해 전달하므로 DNS 고정 및 SSRF 정책의
소유권은 OpenClaw에 유지됩니다. 로컬 Ollama, LM
Studio 또는 LAN 모델 서버에는 네이티브 OpenClaw 런타임을 사용하십시오.

## BYOK

Copilot BYOK는 SDK의 세션 수준 사용자 지정 제공자 계약을 사용합니다. OpenClaw는
확정된 모델 엔드포인트, API 키, 베어러 토큰 모드, 헤더, 모델
ID 및 컨텍스트/출력 한도를 전달합니다. 제공자 전송 로직은 코어가 아니라
SDK에 유지됩니다.

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

BYOK 세션은 구독 세션 및 다른 BYOK 엔드포인트나 자격 증명과
별도로 키가 지정됩니다. 키, 헤더, 모델 또는 엔드포인트를 교체하면
호환되지 않는 상태를 재개하는 대신 새 Copilot SDK 세션이 시작됩니다.

## 인증

`runCopilotAttempt` 중 에이전트별로 적용되는 우선순위는 다음과 같습니다.

1. 시도 입력의 **명시적 `useLoggedInUser: true`** — 에이전트의
   `copilotHome` 아래에서 Copilot CLI에 로그인된 사용자를 사용합니다.
2. 시도 입력의 **명시적 `gitHubToken`**(`profileId` +
   `profileVersion` 필요). 인증 프로필 확인을
   우회해야 하는 직접 CLI 호출 및 테스트용입니다.
3. **계약에서 확인된 `resolvedApiKey` + `authProfileId`** — 프로덕션
   기본 경로입니다. 코어는 하네스를 호출하기 전에 에이전트에 구성된
   `github-copilot` 인증 프로필(`src/infra/provider-usage.auth.ts:resolveProviderAuths`)을
   확인하므로, `github-copilot:<profile>` 인증 프로필이 환경 변수 없이
   헤드리스, Cron 또는 다중 프로필 설정에서 처음부터 끝까지 작동합니다.
4. **환경 변수 대체 경로**는 다음 순서로 확인합니다(비어 있지 않은 첫 번째 값이
   사용되며 빈 문자열은 없는 것으로 간주합니다. `extensions/github-copilot/auth.ts`에 제공된
   `github-copilot` 제공자 우선순위와 동일합니다).
   1. `OPENCLAW_GITHUB_TOKEN` — 하네스별 재정의입니다. 시스템 전체 `gh` /
      Copilot CLI 구성을 방해하지 않고 OpenClaw 하네스용
      토큰을 고정할 수 있습니다.
   2. `COPILOT_GITHUB_TOKEN` — 표준 Copilot SDK / CLI 환경 변수입니다.
   3. `GH_TOKEN` — 표준 `gh` CLI 환경 변수입니다.
   4. `GITHUB_TOKEN` — 일반 GitHub 토큰 대체 경로입니다.

   합성된 풀 프로필 ID는 `env:<NAME>`이며, 프로필 버전은 토큰의
   비가역적 sha256 지문이므로 환경 변수 값을 교체하면
   클라이언트 풀이 깔끔하게 무효화됩니다.

5. 토큰 신호를 사용할 수 없을 때의 **기본 `useLoggedInUser`**.

각 에이전트에는 자체 `copilotHome`이 할당되므로 동일한 머신의 에이전트 간에
Copilot CLI 토큰, 세션 및 구성이 유출되지 않습니다. 기본값은
`<agentDir>/copilot`(SDK 상태를 OpenClaw의
`models.json` / `auth-profiles.json`과 같은 디렉터리에 두지 않음)이며,
에이전트 디렉터리가 제공되지 않으면 `~/.openclaw/agents/<agentId>/copilot`입니다.
사용자 지정 위치(예: 마이그레이션용 공유 마운트)를 사용하려면 시도 입력에서
`copilotHome: <path>`로 재정의하십시오.

실시간 하네스 테스트는 직접 토큰에 `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN`을 사용합니다.
공유 실시간 테스트 설정은 실제 인증 프로필을 격리된 테스트 홈에 준비한 후
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN`,
`GITHUB_TOKEN`을 제거하므로, 전용 변수를 통해 전달된 `gh auth token` 값은
관련 없는 스위트로 유출되지 않으면서 잘못된 건너뛰기를 방지합니다.

## 구성 표면

하네스는 시도별 입력(`runCopilotAttempt({...})`)과
`extensions/copilot/src/` 내부의 소수 환경 기본값에서 구성을 읽습니다.

| 필드                    | 용도                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`            | 에이전트별 CLI 상태 디렉터리(기본값은 위 참조).                                                                                                                                                                                                                                                 |
| `model`                  | 문자열 또는 `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. 생략하면 에이전트의 일반 모델 선택을 사용하며, 하네스는 확인된 제공자가 지원되는지 검증합니다.                                                                                                                   |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. `auto-reply/thinking.ts`에서 OpenClaw의 `ThinkLevel` / `ReasoningLevel` 확인 결과로 매핑됩니다.                                                                                                                                                          |
| `infiniteSessionConfig`  | `harness.compact`이 구동하는 SDK `infiniteSessions` 블록에 대한 선택적 재정의입니다. 그대로 두어도 안전합니다.                                                                                                                                                                                        |
| `hooksConfig`            | 도구/MCP, 사용자 프롬프트, 세션 및 오류 콜백을 위한 선택적 네이티브 Copilot SDK `SessionHooks` 구성입니다. OpenClaw의 이식 가능한 수명 주기 훅과는 별개입니다.                                                                                                                                   |
| `permissionPolicy`       | 내장 SDK 도구 종류(`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`)를 위한 SDK의 `onPermissionRequest` 처리기에 대한 선택적 재정의입니다. 안전망으로 기본값은 `rejectAllPolicy`입니다. 실제로 실행되지 않는 이유는 [권한 및 ask_user](#permissions-and-ask_user)를 참조하십시오. |
| `enableSessionTelemetry` | 선택적 SDK 세션 원격 측정 플래그입니다.                                                                                                                                                                                                                                                            |

OpenClaw Plugin 훅에는 Copilot 전용 시도 구성이 필요하지 않습니다.
하네스는 표준 하네스 도우미를 통해 `before_prompt_build`(및 레거시 `before_agent_start`
호환성 훅), `llm_input`, `llm_output`, `agent_end`을 실행합니다.
SDK Compaction이 성공하면 `before_compaction` 및 `after_compaction`도
실행됩니다. 브리지된 OpenClaw 도구는 `before_tool_call`을 실행하고
`after_tool_call`을 보고합니다. `hooksConfig`은 이식 가능한 대응 항목이 없는
네이티브 SDK 전용 콜백용으로 유지됩니다.

OpenClaw의 다른 부분은 이러한 필드를 알 필요가 없습니다. 다른 Plugin,
채널 및 코어 코드는 표준 `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult` 형식만 확인합니다.

## Compaction

`harness.compact`이 실행되면 Copilot SDK 하네스는 다음을 수행합니다.

1. 대기 중인 작업을 계속하지 않고 추적된 SDK 세션을 재개합니다.
2. SDK의 세션 범위 기록 Compaction RPC를 호출합니다.
3. 워크스페이스 아래에 호환성 마커 파일을 기록하지 않고 SDK Compaction 결과를
   반환합니다.

OpenClaw 측 트랜스크립트 미러(아래)는 Compaction 이후의
메시지를 계속 수신하므로 사용자에게 표시되는 채팅 기록이 일관되게 유지됩니다.

## 트랜스크립트 미러링

`runCopilotAttempt`는 각 턴에서 미러링 가능한 메시지를
`extensions/copilot/src/dual-write-transcripts.ts`를 통해 OpenClaw 감사 트랜스크립트에
이중 기록합니다. 미러는 세션별로 범위가 지정되고
(`copilot:${sessionId}`) 메시지별로 키가 지정되므로
(`${role}:${sha256_16(role,content)}`), 이전 턴의 항목이 다시 방출되면
중복되지 않고 디스크에 이미 존재하는 키와 충돌합니다.

트랜스크립트 쓰기 실패로 인해 시도가 실패하지 않도록 두 계층의 실패
격리가 미러를 감쌉니다. 내부 최선형 래퍼와 시도 수준의
심층 방어 `.catch(...)`입니다. 실패는 로그에 기록되며
표면화되지 않습니다.

## 부가 질문 (`/btw`)

`/btw`는 이 하네스에서 네이티브로 지원되지 **않습니다**. `createCopilotAgentHarness()`는
의도적으로 `harness.runSideQuestion`를 정의되지 않은 상태로 둡니다
(`extensions/copilot/harness.test.ts`, `describe("runSideQuestion")`에서 단언).
따라서 OpenClaw의 `/btw` 디스패처(`src/agents/btw.ts`)는
Codex 이외의 모든 런타임에 사용하는 동일한 경로로 폴스루합니다. 구성된 모델 제공자가
짧은 부가 질문 프롬프트로 직접 호출되고, 결과는
`streamSimple`를 통해 다시 스트리밍됩니다(CLI 세션과 추가 풀 슬롯 없음).

이렇게 하면 Copilot CLI 세션이 에이전트의 기본 턴 루프에만 사용되며,
`/btw` 동작이 Codex 이외의 다른 런타임과 동일하게 유지됩니다.

## Doctor

`extensions/copilot/doctor-contract-api.ts`는
`src/plugins/doctor-contract-registry.ts`에 의해 자동으로 로드됩니다. 다음을 제공합니다.

- 빈 `legacyConfigRules`(아직 폐기된 필드 없음).
- 아무 작업도 하지 않는 `normalizeCompatibilityConfig`(향후 필드 폐기 시
  트리 내의 안정적인 위치를 제공하도록 유지).
- `sessionRouteStateOwners` 항목 1개: 제공자 `github-copilot`, 런타임
  `copilot`, CLI 세션 키 `copilot`, 인증 프로필 접두사 `github-copilot:`.

## 제한 사항

- 하네스는 `github-copilot`와 소유자가 없는 사용자 지정 BYOK 제공자 ID를 담당합니다.
  매니페스트 소유의 네이티브 제공자 ID는 `agentRuntime.id`가
  `copilot`로 강제되더라도 해당 ID를 소유한 런타임에 유지됩니다.
- TUI 표면은 없습니다. 피어 표면이 없는 런타임에서는 PI의 TUI가
  계속 폴백으로 사용됩니다.
- 에이전트가 `copilot`로 전환해도 PI 세션 상태는 마이그레이션되지 않습니다.
  선택은 시도별로 이루어지며, 기존 PI 세션은 계속 유효합니다.
- `ask_user`는 Codex 하네스와 동일한 OpenClaw 프롬프트 및 응답 경로를 사용합니다.
  Copilot SDK가 사용자 입력을 요청하면 OpenClaw는 활성 채널/TUI에
  차단형 프롬프트를 게시하며, 다음으로 대기열에 추가되는 사용자
  메시지가 SDK 요청을 해결합니다.

## 권한 및 ask_user

브리지된 OpenClaw 도구의 권한 적용은 SDK의
`onPermissionRequest` 콜백을 통하지 않고 **도구 래퍼 내부에서** 이루어집니다. PI가 사용하는 것과 동일한
`wrapToolWithBeforeToolCallHook`
(`src/agents/agent-tools.before-tool-call.ts`)가
`createOpenClawCodingTools`에 의해 모든 코딩 도구에 적용됩니다. 루프 감지, 신뢰할 수 있는
Plugin 정책, 도구 호출 전 훅, Gateway를 통한 2단계 Plugin 승인
(`plugin.approval.request`)이 모두 네이티브 PI 시도와 정확히 동일한 코드
경로를 통해 실행됩니다.

Copilot 도구 브리지가 반환하는 각 SDK 도구에는 다음이 표시됩니다.

- `overridesBuiltInTool: true` — 같은 이름의 Copilot CLI 기본 제공 도구
  (edit, read, write, bash, ...)를 대체하여 모든 도구 호출이 OpenClaw로
  다시 라우팅되게 합니다.
- `skipPermission: true` — 도구를 호출하기 전에 SDK가
  `onPermissionRequest({kind: "custom-tool"})`를 실행하지 않도록 지시합니다.
  래핑된 `execute()`가 이미 더 풍부한 OpenClaw 정책 검사를 수행합니다.
  SDK 수준 프롬프트는 OpenClaw의 적용을 우회하거나(모두 허용)
  모든 도구 호출을 차단하게 되므로(모두 거부), 어느 쪽도 PI와의
  동등성에 부합하지 않습니다.

트리 내 Codex 하네스도 동일하게 분리합니다. 브리지된 OpenClaw 도구는
래핑되며(`extensions/codex/src/app-server/dynamic-tools.ts`),
codex-app-server 자체의 네이티브 승인 종류
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`)는 `plugin.approval.request`를 통해 라우팅됩니다
(`extensions/codex/src/app-server/approval-bridge.ts`). Copilot SDK에서 이에 해당하는 것은
`onPermissionRequest`에 도달하는 모든 비-`custom-tool` 종류에 대해 실패 시 닫히는
`rejectAllPolicy`이며, 동일한 안전망 역할을 합니다. `overridesBuiltInTool: true`가 모든
기본 제공 도구를 대체하므로 실제로는 절대 실행되지 않습니다.

래핑된 도구 계층이 PI와 동등한 정책 결정을 내릴 수 있도록 하네스는
전체 PI 시도 도구 컨텍스트를 `createOpenClawCodingTools`에 전달합니다.
ID(`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), 채널/라우팅(`groupId`,
`currentChannelId`, `replyToMode`, 메시지 도구 토글), 인증
(`authProfileStore`), 실행 ID(`sandboxSessionKey`, `runId`에서 파생된
`sessionKey` / `runSessionKey`), 모델 컨텍스트(`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`), 실행 훅
(`onToolOutcome`, `onYield`)이 포함됩니다. 이러한 필드가 없으면 소유자 전용 허용 목록이
기본적으로 조용히 거부하고, Plugin 신뢰 정책이 올바른
범위로 해석되지 않으며, `session_status: "current"`가 오래된 샌드박스 키로 해석됩니다.
브리지 빌더는 `extensions/copilot/src/tool-bridge.ts`이며, PI의
기준 호출인 `src/agents/embedded-agent-runner/run/attempt.ts:1262`를 그대로 반영합니다.
`runAttempt`는 공유
`resolveSandboxContext` 심을 통해 샌드박스 컨텍스트를 해석하고, SDK에 유효 작업 디렉터리를
전달하며, `sandbox`와 하위 에이전트 생성 작업 공간을 도구
브리지로 전달합니다. 또한 브리지는 SDK 경계에서 적용할 수 있는 제한된 도구 생성 제어 항목인
`includeCoreTools`, 런타임 도구
허용 목록, `toolConstructionPlan`도 전달합니다.

브리지는 PI와의 동등성을 위해
`openclaw/plugin-sdk/agent-harness-tool-runtime`의 공유 하네스 도구 표면 헬퍼도 사용합니다.
도구 검색이 활성화되면 SDK에는 모든 OpenClaw 도구 스키마 대신 간결한 제어 도구와 숨겨진
카탈로그 실행기가 표시됩니다. 코드 모드가
활성화되면 헬퍼는 다른 에이전트 하네스에서 사용하는 것과 동일한 코드 모드 제어 표면과 카탈로그
수명 주기를 구성합니다. 로컬 모델의 간소화된 기본값,
런타임 호환 스키마 필터링, 디렉터리 하이드레이션, 카탈로그
정리는 모두 공유 헬퍼에 유지되므로 Copilot과 Codex 인접
하네스 간에 차이가 발생하지 않습니다.

### 세션 수준 GitHub 토큰

Copilot SDK 계약은 CLI 프로세스 자체를 인증하는 **클라이언트 수준** GitHub 토큰
(`CopilotClientOptions.gitHubToken`)과
해당 세션의 콘텐츠 제외, 모델 라우팅 및 할당량을 결정하는 **세션 수준** 토큰
(`SessionConfig.gitHubToken`)을 구분합니다. 후자는
`createSession`과 `resumeSession` 모두에서 적용됩니다. 하네스는
`resolveCopilotAuth`를 통해 인증을 한 번 해석하고, 인증 모드가 `gitHubToken`이면
두 필드를 모두 설정합니다(명시적 `auth.gitHubToken` 또는 구성된
`github-copilot` 인증 프로필에서 계약에 따라 해석된 `resolvedApiKey`). 해석된 모드가
`useLoggedInUser`이면 세션 수준 필드를 생략하여 SDK가 로그인된 ID에서
계속 ID를 파생하도록 합니다.

`ask_user`는 `SessionConfig.onUserInputRequest`를 사용합니다. 브리지는 고정 선택 요청에서
선택 항목의 인덱스 또는 레이블을 허용하고, SDK 요청이 허용하는 경우 자유 형식 답변을
허용하며, OpenClaw 시도가 중단되면 대기 중인 요청을 취소합니다.

## 관련 문서

- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [Codex 하네스](/ko/plugins/codex-harness)
- [에이전트 하네스 Plugin(SDK 참조)](/ko/plugins/sdk-agent-harness)
