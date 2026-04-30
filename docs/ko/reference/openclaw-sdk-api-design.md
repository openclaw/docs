---
read_when:
    - 제안된 공개 OpenClaw 앱 SDK를 구현하고 있습니다
    - 앱 SDK의 초안 네임스페이스, 이벤트, 결과, 아티팩트, 승인 또는 보안 규약이 필요합니다
    - Gateway 프로토콜 리소스와 고수준 OpenClaw App SDK 래퍼를 비교하고 있습니다
sidebarTitle: App SDK API design
summary: 공개 OpenClaw 앱 SDK API, 이벤트 분류 체계, 아티팩트, 승인, 패키지 구조에 대한 참조 설계
title: OpenClaw 앱 SDK API 설계
x-i18n:
    generated_at: "2026-04-30T06:49:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

이 페이지는 공개 [OpenClaw 앱 SDK](/ko/concepts/openclaw-sdk)를 위한 상세 API 참조 설계입니다. 이는 의도적으로 [Plugin SDK](/ko/plugins/sdk-overview)와 분리되어 있습니다.

<Note>
  `@openclaw/sdk`는 Gateway와 통신하기 위한 외부 앱/클라이언트 패키지입니다. `openclaw/plugin-sdk/*`는 프로세스 내부 Plugin 작성 계약입니다.
  에이전트 실행만 필요한 앱에서는 Plugin SDK 하위 경로를 가져오지 마세요.
</Note>

공개 앱 SDK는 두 계층으로 빌드되어야 합니다.

1. 저수준 생성 Gateway 클라이언트.
2. `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval`, `Environment` 객체를 갖춘 고수준의 사용하기 쉬운 래퍼.

## 네임스페이스 설계

저수준 네임스페이스는 Gateway 리소스를 밀접하게 따라야 합니다.

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

고수준 래퍼는 일반적인 흐름을 편하게 만드는 객체를 반환해야 합니다.

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## 이벤트 계약

공개 SDK는 버전이 지정되고, 재생 가능하며, 정규화된 이벤트를 노출해야 합니다.

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
  raw?: unknown;
};
```

`id`는 재생 커서입니다. 소비자는 `events({ after: id })`로 다시 연결하고 보존 기간이 허용하는 경우 놓친 이벤트를 받을 수 있어야 합니다.

권장 정규화 이벤트 계열:

| 이벤트                 | 의미                                                     |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | 실행이 수락되었습니다.                                               |
| `run.queued`          | 실행이 세션 레인, 런타임 또는 환경을 기다리고 있습니다. |
| `run.started`         | 런타임이 실행을 시작했습니다.                                  |
| `run.completed`       | 실행이 성공적으로 완료되었습니다.                                  |
| `run.failed`          | 실행이 오류로 종료되었습니다.                                    |
| `run.cancelled`       | 실행이 취소되었습니다.                                          |
| `run.timed_out`       | 실행이 제한 시간을 초과했습니다.                                   |
| `assistant.delta`     | 어시스턴트 텍스트 델타.                                       |
| `assistant.message`   | 완전한 어시스턴트 메시지 또는 대체 메시지.                  |
| `thinking.delta`      | 정책이 노출을 허용할 때 추론 또는 계획 델타.       |
| `tool.call.started`   | 도구 호출이 시작되었습니다.                                            |
| `tool.call.delta`     | 도구 호출이 진행 상황 또는 부분 출력을 스트리밍했습니다.              |
| `tool.call.completed` | 도구 호출이 성공적으로 반환되었습니다.                            |
| `tool.call.failed`    | 도구 호출이 실패했습니다.                                           |
| `approval.requested`  | 실행 또는 도구에 승인이 필요합니다.                               |
| `approval.resolved`   | 승인이 허용, 거부, 만료 또는 취소되었습니다.        |
| `question.requested`  | 런타임이 사용자 또는 호스트 앱에 입력을 요청합니다.                |
| `question.answered`   | 호스트 앱이 답변을 제공했습니다.                                |
| `artifact.created`    | 새 아티팩트를 사용할 수 있습니다.                                     |
| `artifact.updated`    | 기존 아티팩트가 변경되었습니다.                                  |
| `session.created`     | 세션이 생성되었습니다.                                            |
| `session.updated`     | 세션 메타데이터가 변경되었습니다.                                   |
| `session.compacted`   | 세션 Compaction이 발생했습니다.                                |
| `task.updated`        | 백그라운드 작업 상태가 변경되었습니다.                              |
| `git.branch`          | 런타임이 브랜치 상태를 관찰했거나 변경했습니다.                   |
| `git.diff`            | 런타임이 diff를 생성했거나 변경했습니다.                         |
| `git.pr`              | 런타임이 풀 리퀘스트를 열거나, 업데이트하거나, 연결했습니다.          |

런타임 고유 페이로드는 `raw`를 통해 사용할 수 있어야 하지만, 앱이 일반 UI를 위해 `raw`를 파싱해야 해서는 안 됩니다.

## 결과 계약

`Run.wait()`는 안정적인 결과 봉투를 반환해야 합니다.

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

결과는 단순하고 안정적이어야 합니다. 타임스탬프 값은 Gateway 형식을 보존하므로 현재 라이프사이클 기반 실행은 일반적으로 에포크 밀리초 숫자를 보고하지만, 어댑터는 여전히 ISO 문자열을 노출할 수 있습니다. 풍부한 UI, 도구 추적, 런타임 고유 세부 정보는 이벤트와 아티팩트에 속합니다.

`accepted`는 비종료 대기 결과입니다. 이는 실행이 라이프사이클 종료/오류를 생성하기 전에 Gateway 대기 기한이 만료되었음을 의미합니다. 이를 `timed_out`으로 취급해서는 안 됩니다. `timed_out`은 실행 자체의 런타임 제한 시간을 초과한 실행에만 예약됩니다.

## 승인과 질문

코딩 에이전트는 지속적으로 안전 경계를 넘나들기 때문에 승인은 일급 개념이어야 합니다.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

승인 이벤트는 다음을 포함해야 합니다.

- 승인 ID
- 실행 ID와 세션 ID
- 요청 종류
- 요청된 작업 요약
- 도구 이름 또는 환경 작업
- 위험 수준
- 사용 가능한 결정
- 만료
- 결정을 재사용할 수 있는지 여부

질문은 승인과 별개입니다. 질문은 사용자 또는 호스트 앱에 정보를 요청합니다. 승인은 작업 수행 권한을 요청합니다.

## ToolSpace 모델

앱은 Plugin 내부를 가져오지 않고도 도구 표면을 이해해야 합니다.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK는 다음을 노출해야 합니다.

- 정규화된 도구 메타데이터
- 소스: OpenClaw, MCP, Plugin, 채널, 런타임 또는 앱
- 스키마 요약
- 승인 정책
- 런타임 호환성
- 도구가 숨겨져 있는지, 읽기 전용인지, 쓰기 가능한지 또는 호스트 가능한지 여부

SDK를 통한 도구 호출은 명시적이고 범위가 지정되어야 합니다. 대부분의 앱은 임의의 도구를 직접 호출하는 것이 아니라 에이전트를 실행해야 합니다.

## 아티팩트 모델

아티팩트는 파일 이상의 것을 포괄해야 합니다.

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

일반적인 예:

- 파일 편집과 생성된 파일
- 패치 번들
- VCS diff
- 스크린샷과 미디어 출력
- 로그와 추적 번들
- 풀 리퀘스트 링크
- 런타임 궤적
- 관리형 환경 워크스페이스 스냅샷

아티팩트 접근은 모든 아티팩트가 일반 로컬 파일이라고 가정하지 않고, 수정, 보존, 다운로드 URL을 지원해야 합니다.

## 보안 모델

앱 SDK는 권한을 명시해야 합니다.

권장 토큰 범위:

| 범위               | 허용 사항                                              |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | 에이전트를 나열하고 검사합니다.                            |
| `agent.run`         | 실행을 시작합니다.                                         |
| `session.read`      | 세션 메타데이터와 메시지를 읽습니다.                 |
| `session.write`     | 세션을 생성, 전송, 포크, 압축, 중단합니다. |
| `task.read`         | 백그라운드 작업 상태를 읽습니다.                         |
| `task.write`        | 작업 알림 정책을 취소하거나 수정합니다.          |
| `approval.respond`  | 요청을 승인하거나 거부합니다.                           |
| `tools.invoke`      | 노출된 도구를 직접 호출합니다.                      |
| `artifacts.read`    | 아티팩트를 나열하고 다운로드합니다.                        |
| `environment.write` | 관리형 환경을 생성하거나 파괴합니다.             |
| `admin`             | 관리 작업.                          |

기본값:

- 기본적으로 비밀을 전달하지 않음
- 제한 없는 환경 변수 전달 없음
- 비밀 값 대신 비밀 참조
- 명시적 샌드박스와 네트워크 정책
- 명시적 원격 환경 보존
- 정책이 달리 증명하지 않는 한 호스트 실행에는 승인 필요
- 호출자에게 더 강한 진단 범위가 없는 한, 원시 런타임 이벤트는 Gateway를 떠나기 전에 수정됨

## 관리형 환경 제공자

관리형 에이전트는 환경 제공자로 구현되어야 합니다.

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

첫 구현은 호스팅 SaaS일 필요가 없습니다. 기존 Node 호스트, 임시 워크스페이스, CI 스타일 러너 또는 Testbox 스타일 환경을 대상으로 할 수 있습니다. 중요한 계약은 다음과 같습니다.

1. 워크스페이스 준비
2. 안전한 환경과 비밀 바인딩
3. 실행 시작
4. 이벤트 스트리밍
5. 아티팩트 수집
6. 정책에 따라 정리하거나 보존

이것이 안정화되면 호스팅 클라우드 서비스가 동일한 제공자 계약을 구현할 수 있습니다.

## 패키지 구조

권장 패키지:

| 패키지                 | 목적                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | 공개 고수준 SDK와 생성된 저수준 Gateway 클라이언트. |
| `@openclaw/sdk-react`   | 대시보드와 앱 빌더를 위한 선택적 React 훅.         |
| `@openclaw/sdk-testing` | 앱 통합을 위한 테스트 헬퍼와 가짜 Gateway 서버.    |

이 리포지토리에는 이미 Plugin을 위한 `openclaw/plugin-sdk/*`가 있습니다. Plugin 작성자와 앱 개발자를 혼동하지 않도록 해당 네임스페이스를 분리해 유지하세요.

## 생성된 클라이언트 전략

저수준 클라이언트는 버전이 지정된 Gateway 프로토콜 스키마에서 생성한 다음, 손으로 작성한 사용하기 편한 클래스로 감싸야 합니다.

계층:

1. Gateway 스키마 원본.
2. 생성된 저수준 TypeScript 클라이언트.
3. 외부 입력 및 이벤트 페이로드용 런타임 유효성 검사기.
4. 고수준 `OpenClaw`, `Agent`, `Session`, `Run`, `Task`, `Artifact`
   래퍼.
5. Cookbook 예제 및 통합 테스트.

이점:

- 프로토콜 변동이 명확하게 드러납니다
- 테스트에서 생성된 메서드를 Gateway export와 비교할 수 있습니다
- 앱 SDK가 Plugin SDK 내부 구현과 독립적으로 유지됩니다
- 저수준 소비자는 여전히 전체 프로토콜에 접근할 수 있습니다
- 고수준 소비자는 작은 제품 API를 사용할 수 있습니다

## 관련 문서

- [OpenClaw 앱 SDK](/ko/concepts/openclaw-sdk)
- [Gateway RPC 참조](/ko/reference/rpc)
- [에이전트 루프](/ko/concepts/agent-loop)
- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [백그라운드 작업](/ko/automation/tasks)
- [ACP 에이전트](/ko/tools/acp-agents)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
