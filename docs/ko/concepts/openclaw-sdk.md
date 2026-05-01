---
read_when:
    - OpenClaw와 통신하는 외부 앱, 스크립트, 대시보드, CI 작업 또는 IDE 확장을 빌드하고 있습니다
    - 앱 SDK와 Plugin SDK 중에서 선택하고 있습니다
    - Gateway 에이전트 실행, 세션, 이벤트, 승인, 모델 또는 도구와 통합하는 경우
sidebarTitle: App SDK
summary: 외부 앱, 스크립트, 대시보드, CI 작업 및 IDE 확장을 위한 공개 OpenClaw 앱 SDK
title: OpenClaw 앱 SDK
x-i18n:
    generated_at: "2026-05-01T06:24:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: e531e985ca82026b230b03f8df5ab908d66e2b608e09c46af2ec060b9def0c24
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK**는 OpenClaw 프로세스 외부의 앱을 위한 공개 클라이언트 API입니다. 스크립트, 대시보드, CI 작업, IDE 확장 프로그램 또는 기타 외부 앱이 Gateway에 연결하거나, 에이전트 실행을 시작하거나, 이벤트를 스트리밍하거나, 결과를 기다리거나, 작업을 취소하거나, Gateway 리소스를 검사하려는 경우 `@openclaw/sdk`를 사용하세요.

<Note>
  App SDK는 [Plugin SDK](/ko/plugins/sdk-overview)와 다릅니다.
  `@openclaw/sdk`는 OpenClaw 외부에서 Gateway와 통신합니다.
  `openclaw/plugin-sdk/*`는 OpenClaw 내부에서 실행되며 provider, channel, tool, hook 또는 신뢰할 수 있는 runtime을 등록하는 Plugin 전용입니다.
</Note>

## 현재 제공되는 항목

`@openclaw/sdk`는 다음을 제공합니다.

| 인터페이스              | 상태      | 기능                                                                         |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | 준비됨   | 기본 클라이언트 진입점입니다. transport, 연결, 요청, 이벤트를 소유합니다.   |
| `GatewayClientTransport`  | 준비됨   | Gateway 클라이언트 기반 WebSocket transport입니다.                            |
| `oc.agents`               | 준비됨   | 에이전트 핸들을 나열, 생성, 업데이트, 삭제, 조회합니다.                    |
| `Agent.run()`             | 준비됨   | Gateway `agent` 실행을 시작하고 `Run`을 반환합니다.                            |
| `oc.runs`                 | 준비됨   | 실행을 생성, 조회, 대기, 취소, 스트리밍합니다.                         |
| `Run.events()`            | 준비됨   | 빠른 실행을 위한 재생 기능과 함께 실행별 정규화 이벤트를 스트리밍합니다.                 |
| `Run.wait()`              | 준비됨   | `agent.wait`를 호출하고 안정적인 `RunResult`를 반환합니다.                         |
| `Run.cancel()`            | 준비됨   | 사용 가능한 경우 세션 키와 함께 실행 id로 `sessions.abort`를 호출합니다.           |
| `oc.sessions`             | 준비됨   | 세션 핸들을 생성, 해석, 전송, 패치, compact, 조회합니다.    |
| `Session.send()`          | 준비됨   | `sessions.send`를 호출하고 `Run`을 반환합니다.                                   |
| `oc.models`               | 준비됨   | `models.list`와 현재 `models.authStatus` 상태 RPC를 호출합니다.          |
| `oc.tools`                | 부분 지원 | tool 카탈로그와 유효 tool을 나열합니다. 직접 tool 호출은 연결되어 있지 않습니다. |
| `oc.artifacts`            | 준비됨   | Gateway transcript artifact를 나열, 조회, 다운로드합니다.                     |
| `oc.approvals`            | 준비됨   | Gateway 승인 RPC를 통해 exec 승인을 나열하고 처리합니다.             |
| `oc.rawEvents()`          | 준비됨   | 고급 소비자를 위해 원시 Gateway 이벤트를 노출합니다.                           |
| `normalizeGatewayEvent()` | 준비됨   | 원시 Gateway 이벤트를 안정적인 SDK 이벤트 형태로 변환합니다.                 |

SDK는 이러한 인터페이스에서 사용하는 핵심 타입도 내보냅니다.
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` 및 관련
결과 타입입니다.

## Gateway에 연결하기

명시적인 Gateway URL로 클라이언트를 만들거나, 테스트 및 임베디드 앱 runtime을 위해 사용자 지정 transport를 주입하세요.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })`는 `url`과 동일합니다. `gateway: "auto"` 옵션은 생성자에서 허용되지만, 자동 Gateway 검색은 아직 별도의 SDK 기능이 아닙니다. 앱이 Gateway를 검색하는 방법을 이미 알고 있지 않다면 `url`을 전달하세요.

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

앱이 에이전트 핸들을 필요로 할 때 `oc.agents.get(id)`를 사용한 다음 `agent.run()`을 호출하세요.

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

`openai/gpt-5.5` 같은 provider 한정 model 참조는 Gateway `provider` 및 `model` override로 분리됩니다. `timeoutMs`는 SDK에서 밀리초로 유지되며 `agent` RPC용 Gateway timeout 초 단위로 변환됩니다.

`run.wait()`는 Gateway `agent.wait` RPC를 사용합니다. 실행이 아직 활성 상태인 동안 대기 기한이 만료되면, 실행 자체가 timeout된 것처럼 가장하지 않고 `status: "accepted"`를 반환합니다. runtime timeout, 중단된 실행, 취소된 실행은 `timed_out` 또는 `cancelled`로 정규화됩니다.

## 세션 생성 및 재사용

앱이 지속 가능한 transcript 상태를 원할 때 세션을 사용하세요.

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

SDK는 원시 Gateway 이벤트를 안정적인 `OpenClawEvent` envelope로 정규화합니다.

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

| 이벤트 타입            | 원본 Gateway 이벤트                        |
| --------------------- | ------------------------------------------- |
| `run.started`         | `agent` lifecycle 시작                     |
| `run.completed`       | `agent` lifecycle 종료                       |
| `run.failed`          | `agent` lifecycle 오류                     |
| `run.cancelled`       | 중단/취소된 lifecycle 종료             |
| `run.timed_out`       | timeout lifecycle 종료                       |
| `assistant.delta`     | Assistant 스트리밍 delta                   |
| `assistant.message`   | Assistant 메시지                           |
| `thinking.delta`      | 사고 또는 계획 스트림                     |
| `tool.call.started`   | Tool/item/command 시작                     |
| `tool.call.delta`     | Tool/item/command 업데이트                    |
| `tool.call.completed` | Tool/item/command 완료                |
| `tool.call.failed`    | Tool/item/command 실패 또는 차단 상태 |
| `approval.requested`  | Exec 또는 Plugin 승인 요청             |
| `approval.resolved`   | Exec 또는 Plugin 승인 처리          |
| `session.created`     | `sessions.changed` 생성                   |
| `session.updated`     | `sessions.changed` 업데이트                   |
| `session.compacted`   | `sessions.changed` Compaction               |
| `task.updated`        | Task 업데이트 이벤트                          |
| `artifact.updated`    | Patch 스트림 이벤트                         |
| `raw`                 | 아직 안정적인 SDK 매핑이 없는 모든 이벤트  |

`Run.events()`는 이벤트를 하나의 실행 id로 필터링하고 빠른 실행을 위해 이미 본 이벤트를 재생합니다. 따라서 문서화된 흐름은 안전합니다.

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

앱 전체 스트림에는 `oc.events()`를 사용하세요. 원시 Gateway frame에는 `oc.rawEvents()`를 사용하세요.

## 모델, Tool, Artifact 및 승인

모델 helper는 현재 Gateway method에 매핑됩니다.

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Tool helper는 Gateway 카탈로그와 유효 tool 뷰를 노출합니다.

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Artifact helper는 세션, 실행 또는 task context에 대한 Gateway artifact projection을 노출합니다. 각 호출에는 명시적인 `sessionKey`, `runId` 또는 `taskId` scope 중 하나가 필요합니다.

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

승인 helper는 exec 승인 RPC를 사용합니다.

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## 현재 명시적으로 지원되지 않는 항목

SDK에는 우리가 원하는 제품 모델의 이름이 포함되어 있지만, Gateway RPC가 존재하는 것처럼 조용히 가장하지 않습니다. 현재 다음 호출은 명시적인 미지원 오류를 throw합니다.

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

실행별 `workspace`, `runtime`, `environment`, `approvals` 필드는 future shape으로 타입이 지정되어 있지만, 현재 Gateway는 `agent` RPC에서 이러한 override를 지원하지 않습니다. 호출자가 이를 전달하면 SDK는 실행을 제출하기 전에 throw하여, 작업이 기본 workspace, runtime, environment 또는 승인 동작으로 우발적으로 실행되지 않게 합니다.

## App SDK와 Plugin SDK 비교

코드가 OpenClaw 외부에 있을 때 App SDK를 사용하세요.

- 에이전트 실행을 시작하거나 관찰하는 Node 스크립트
- Gateway를 호출하는 CI 작업
- 대시보드 및 관리자 패널
- IDE 확장 프로그램
- channel Plugin이 될 필요가 없는 외부 bridge
- 가짜 또는 실제 Gateway transport를 사용하는 통합 테스트

코드가 OpenClaw 내부에서 실행될 때 Plugin SDK를 사용하세요.

- provider Plugin
- channel Plugin
- tool 또는 lifecycle hook
- 에이전트 harness Plugin
- 신뢰할 수 있는 runtime helper

App SDK 코드는 `@openclaw/sdk`에서 import해야 합니다. Plugin 코드는 문서화된 `openclaw/plugin-sdk/*` 하위 경로에서 import해야 합니다. 두 contract를 섞지 마세요.

## 관련 문서

- [OpenClaw App SDK API 설계](/ko/reference/openclaw-sdk-api-design)
- [Gateway RPC 참조](/ko/reference/rpc)
- [에이전트 loop](/ko/concepts/agent-loop)
- [에이전트 runtime](/ko/concepts/agent-runtimes)
- [세션](/ko/concepts/session)
- [백그라운드 task](/ko/automation/tasks)
- [ACP 에이전트](/ko/tools/acp-agents)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
