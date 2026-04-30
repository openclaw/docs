---
read_when:
    - OpenClaw와 통신하는 외부 앱, 스크립트, 대시보드, CI 작업 또는 IDE 확장을 빌드하고 있습니다
    - 앱 SDK와 Plugin SDK 중에서 선택하고 있습니다
    - Gateway 에이전트 실행, 세션, 이벤트, 승인, 모델 또는 도구와 통합하는 경우
sidebarTitle: App SDK
summary: 외부 앱, 스크립트, 대시보드, CI 작업, IDE 확장 프로그램을 위한 공개 OpenClaw 앱 SDK
title: OpenClaw 앱 SDK
x-i18n:
    generated_at: "2026-04-30T06:27:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK**는 OpenClaw 프로세스 외부의 앱을 위한 공개 클라이언트 API입니다. 스크립트, 대시보드, CI 작업, IDE 확장 또는 기타 외부 앱이 Gateway에 연결하거나, 에이전트 실행을 시작하거나, 이벤트를 스트리밍하거나, 결과를 기다리거나, 작업을 취소하거나, Gateway 리소스를 검사하려는 경우 `@openclaw/sdk`를 사용하세요.

<Note>
  App SDK는 [Plugin SDK](/ko/plugins/sdk-overview)와 다릅니다.
  `@openclaw/sdk`는 OpenClaw 외부에서 Gateway와 통신합니다.
  `openclaw/plugin-sdk/*`는 OpenClaw 내부에서 실행되며 공급자, 채널, 도구, 훅 또는 신뢰할 수 있는 런타임을 등록하는 plugins 전용입니다.
</Note>

## 현재 제공되는 기능

`@openclaw/sdk`는 다음을 제공합니다.

| 표면                      | 상태    | 수행하는 작업                                                                  |
| ------------------------- | ------- | ----------------------------------------------------------------------------- |
| `OpenClaw`                | 준비됨  | 기본 클라이언트 진입점입니다. 전송, 연결, 요청 및 이벤트를 소유합니다.        |
| `GatewayClientTransport`  | 준비됨  | Gateway 클라이언트가 뒷받침하는 WebSocket 전송입니다.                         |
| `oc.agents`               | 준비됨  | 에이전트 핸들을 나열, 생성, 업데이트, 삭제 및 가져옵니다.                    |
| `Agent.run()`             | 준비됨  | Gateway `agent` 실행을 시작하고 `Run`을 반환합니다.                           |
| `oc.runs`                 | 준비됨  | 실행을 생성, 가져오기, 대기, 취소 및 스트리밍합니다.                          |
| `Run.events()`            | 준비됨  | 빠른 실행을 위한 재생과 함께 실행별 정규화된 이벤트를 스트리밍합니다.         |
| `Run.wait()`              | 준비됨  | `agent.wait`를 호출하고 안정적인 `RunResult`를 반환합니다.                    |
| `Run.cancel()`            | 준비됨  | 사용할 수 있는 경우 세션 키와 함께 실행 id로 `sessions.abort`를 호출합니다.   |
| `oc.sessions`             | 준비됨  | 세션 핸들을 생성, 확인, 전송, 패치, 압축 및 가져옵니다.                       |
| `Session.send()`          | 준비됨  | `sessions.send`를 호출하고 `Run`을 반환합니다.                                |
| `oc.models`               | 준비됨  | `models.list`와 현재 `models.authStatus` 상태 RPC를 호출합니다.               |
| `oc.tools`                | 부분적  | 도구 카탈로그와 유효 도구를 나열합니다. 직접 도구 호출은 연결되어 있지 않습니다. |
| `oc.approvals`            | 준비됨  | Gateway 승인 RPC를 통해 실행 승인을 나열하고 해결합니다.                     |
| `oc.rawEvents()`          | 준비됨  | 고급 소비자를 위해 원시 Gateway 이벤트를 노출합니다.                          |
| `normalizeGatewayEvent()` | 준비됨  | 원시 Gateway 이벤트를 안정적인 SDK 이벤트 형태로 변환합니다.                  |

SDK는 이러한 표면에서 사용하는 핵심 타입도 내보냅니다.
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` 및 관련 결과 타입입니다.

## Gateway에 연결하기

명시적인 Gateway URL로 클라이언트를 만들거나, 테스트 및 임베디드 앱 런타임을 위해 사용자 지정 전송을 주입하세요.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })`는 `url`과 동일합니다. `gateway: "auto"` 옵션은 생성자에서 허용되지만, 자동 Gateway 검색은 아직 별도의 SDK 기능이 아닙니다. 앱이 Gateway를 검색하는 방법을 이미 알고 있지 않은 경우 `url`을 전달하세요.

테스트에서는 `OpenClawTransport`를 구현하는 객체를 전달하세요.

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## 에이전트 실행하기

앱이 에이전트 핸들을 원할 때 `oc.agents.get(id)`를 사용한 다음 `agent.run()`을 호출하세요.

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

`openai/gpt-5.5` 같은 공급자 한정 모델 참조는 Gateway `provider` 및 `model` 오버라이드로 분리됩니다. `timeoutMs`는 SDK에서 밀리초로 유지되며 `agent` RPC를 위해 Gateway 제한 시간 초로 변환됩니다.

`run.wait()`는 Gateway `agent.wait` RPC를 사용합니다. 실행이 아직 활성 상태인 동안 대기 기한이 만료되면 실행 자체가 시간 초과된 것처럼 가장하지 않고 `status: "accepted"`를 반환합니다. 런타임 시간 초과, 중단된 실행 및 취소된 실행은 `timed_out` 또는 `cancelled`로 정규화됩니다.

## 세션 생성 및 재사용

앱이 지속적인 트랜스크립트 상태를 원할 때 세션을 사용하세요.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()`는 `sessions.send`를 호출하고 `Run`을 반환합니다. 세션 핸들은 다음도 지원합니다.

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## 이벤트 스트리밍

SDK는 원시 Gateway 이벤트를 안정적인 `OpenClawEvent` 봉투로 정규화합니다.

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: GatewayEvent;
};
```

일반적인 이벤트 타입은 다음과 같습니다.

| 이벤트 타입          | 원본 Gateway 이벤트                         |
| -------------------- | ------------------------------------------- |
| `run.started`         | `agent` 수명 주기 시작                      |
| `run.completed`       | `agent` 수명 주기 종료                      |
| `run.failed`          | `agent` 수명 주기 오류                      |
| `run.cancelled`       | 중단/취소된 수명 주기 종료                  |
| `run.timed_out`       | 시간 초과 수명 주기 종료                    |
| `assistant.delta`     | 어시스턴트 스트리밍 델타                    |
| `assistant.message`   | 어시스턴트 메시지                           |
| `thinking.delta`      | 사고 또는 계획 스트림                       |
| `tool.call.started`   | 도구/항목/명령 시작                         |
| `tool.call.delta`     | 도구/항목/명령 업데이트                     |
| `tool.call.completed` | 도구/항목/명령 완료                         |
| `tool.call.failed`    | 도구/항목/명령 실패 또는 차단 상태          |
| `approval.requested`  | 실행 또는 plugin 승인 요청                  |
| `approval.resolved`   | 실행 또는 plugin 승인 해결                  |
| `session.created`     | `sessions.changed` 생성                     |
| `session.updated`     | `sessions.changed` 업데이트                 |
| `session.compacted`   | `sessions.changed` Compaction               |
| `task.updated`        | 작업 업데이트 이벤트                        |
| `artifact.updated`    | 패치 스트림 이벤트                          |
| `raw`                 | 아직 안정적인 SDK 매핑이 없는 모든 이벤트   |

`Run.events()`는 이벤트를 하나의 실행 id로 필터링하고 빠른 실행을 위해 이미 확인한 이벤트를 재생합니다. 즉, 문서화된 흐름은 안전합니다.

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

앱 전체 스트림에는 `oc.events()`를 사용하세요. 원시 Gateway 프레임에는 `oc.rawEvents()`를 사용하세요.

## 모델, 도구 및 승인

모델 헬퍼는 현재 Gateway 메서드에 매핑됩니다.

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

도구 헬퍼는 Gateway 카탈로그와 유효 도구 보기를 노출합니다.

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

승인 헬퍼는 실행 승인 RPC를 사용합니다.

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## 현재 명시적으로 지원되지 않는 기능

SDK에는 우리가 원하는 제품 모델의 이름이 포함되어 있지만, Gateway RPC가 존재하는 것처럼 조용히 가장하지 않습니다. 현재 이러한 호출은 명시적인 미지원 오류를 던집니다.

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

실행별 `workspace`, `runtime`, `environment`, `approvals` 필드는 미래 형태로 타입이 지정되어 있지만, 현재 Gateway는 `agent` RPC에서 이러한 오버라이드를 지원하지 않습니다. 호출자가 이를 전달하면 SDK는 실행을 제출하기 전에 오류를 던지므로 작업이 기본 워크스페이스, 런타임, 환경 또는 승인 동작으로 실수로 실행되지 않습니다.

## App SDK와 Plugin SDK 비교

코드가 OpenClaw 외부에 있을 때 App SDK를 사용하세요.

- 에이전트 실행을 시작하거나 관찰하는 Node 스크립트
- Gateway를 호출하는 CI 작업
- 대시보드 및 관리자 패널
- IDE 확장
- 채널 plugins가 될 필요가 없는 외부 브리지
- 가짜 또는 실제 Gateway 전송을 사용하는 통합 테스트

코드가 OpenClaw 내부에서 실행될 때 Plugin SDK를 사용하세요.

- 공급자 plugins
- 채널 plugins
- 도구 또는 수명 주기 훅
- 에이전트 하네스 plugins
- 신뢰할 수 있는 런타임 헬퍼

App SDK 코드는 `@openclaw/sdk`에서 가져와야 합니다. Plugin 코드는 문서화된 `openclaw/plugin-sdk/*` 하위 경로에서 가져와야 합니다. 두 계약을 혼합하지 마세요.

## 관련 문서

- [OpenClaw App SDK API 설계](/ko/reference/openclaw-sdk-api-design)
- [Gateway RPC 참조](/ko/reference/rpc)
- [에이전트 루프](/ko/concepts/agent-loop)
- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [세션](/ko/concepts/session)
- [백그라운드 작업](/ko/automation/tasks)
- [ACP 에이전트](/ko/tools/acp-agents)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
