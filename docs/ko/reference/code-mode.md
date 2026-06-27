---
read_when:
    - 에이전트 실행에 OpenClaw 코드 모드를 활성화하려고 합니다
    - 코드 모드가 Codex Code 모드와 다른 이유를 설명해야 합니다
    - exec/wait 계약, QuickJS-WASI 샌드박스, TypeScript 변환 또는 숨겨진 도구 카탈로그 브리지를 검토하고 있습니다
    - 내부 코드 모드 네임스페이스 레지스트리 통합을 추가하거나 검토하고 있습니다
sidebarTitle: Code mode
summary: 'OpenClaw 코드 모드: QuickJS-WASI와 숨겨진 실행 범위 도구 카탈로그로 뒷받침되는 옵트인 exec/wait 도구 표면'
title: 코드 모드
x-i18n:
    generated_at: "2026-06-27T18:06:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

코드 모드는 실험적인 OpenClaw 에이전트 런타임 기능입니다. 기본적으로
꺼져 있습니다. 이를 활성화하면 OpenClaw는 한 번의 실행에서 모델이 보는
내용을 변경합니다. 활성화된 모든 도구 스키마를 직접 노출하는 대신 모델은
`exec`와 `wait`만 봅니다.

이 페이지는 OpenClaw 코드 모드를 문서화합니다. Codex Code mode가 아닙니다.
두 기능은 이름을 공유하지만 서로 다른 런타임으로 구현되며 서로 다른
`exec` 계약을 노출합니다.

- Codex Code Mode는 제한적인 도구 정책이 네이티브 코드 모드를 비활성화하지
  않는 한 Codex 앱 서버 스레드에서 활성화됩니다. 이는 Codex 코딩 하네스에서
  실행되며, 모델은 `exec.command` 계약을 통해 셸 명령을 작성합니다.
- OpenClaw 코드 모드는 `tools.codeMode.enabled: true`가 구성되지 않는 한
  비활성화됩니다. 이는 OpenClaw 범용 에이전트 런타임에서 실행되며, 모델은
  `exec.code` 계약을 통해 JavaScript 또는 TypeScript 프로그램을 작성합니다.

Codex Code Mode와 Codex 네이티브 동적 도구 검색은 안정적인 Codex 하네스
표면입니다. OpenClaw 코드 모드는 범용 OpenClaw 실행을 위한 OpenClaw 소유의
실험적 도구 표면 어댑터입니다. 이는 `quickjs-wasi`, 숨겨진 OpenClaw 도구
카탈로그, 일반 OpenClaw 도구 실행기를 사용합니다.

## 이것은 무엇인가요?

OpenClaw 코드 모드를 사용하면 모델이 긴 도구 목록에서 직접 선택하는 대신
작은 JavaScript 또는 TypeScript 프로그램을 작성할 수 있습니다.

코드 모드가 활성화되면:

- 모델에 표시되는 도구 목록은 정확히 `exec`와 `wait`입니다.
- `exec`는 모델이 생성한 JavaScript 또는 TypeScript를 제한된 QuickJS-WASI
  워커에서 평가합니다.
- 일반 OpenClaw 도구는 모델 프롬프트에서 숨겨지고 게스트 프로그램 내부에서
  `ALL_TOOLS`와 `tools`를 통해 노출됩니다.
- 게스트 코드는 숨겨진 카탈로그를 검색하고, 도구를 설명하고, 일반 에이전트
  턴에서 사용하는 것과 동일한 OpenClaw 실행 경로를 통해 도구를 호출할 수
  있습니다.
- MCP 도구는 `MCP` 네임스페이스 아래에 그룹화됩니다. 코드 모드에서 이
  네임스페이스는 MCP 도구를 호출하는 유일하게 지원되는 방법입니다.
- 중첩 도구 호출이 아직 대기 중일 때 `wait`는 일시 중단된 코드 모드 실행을
  재개합니다.

중요한 차이점은 코드 모드가 모델 대상 오케스트레이션 표면을 변경한다는
것입니다. OpenClaw 도구, Plugin 도구, MCP 도구, 인증, 승인 정책, 채널 동작
또는 모델 선택을 대체하지 않습니다.

## 왜 좋은가요?

코드 모드는 큰 도구 카탈로그를 모델이 더 쉽게 사용할 수 있게 합니다.

- 더 작은 프롬프트 표면: 공급자는 수십 개 또는 수백 개의 전체 도구 스키마
  대신 두 개의 제어 도구를 받습니다.
- 더 나은 오케스트레이션: 모델은 하나의 코드 셀 안에서 루프, 조인, 작은 변환,
  조건부 로직, 병렬 중첩 도구 호출을 사용할 수 있습니다.
- 공급자 중립: 공급자 네이티브 코드 실행에 의존하지 않고 OpenClaw, Plugin,
  MCP, 클라이언트 도구에서 작동합니다.
- 기존 정책 유지: 중첩 도구 호출도 여전히 OpenClaw 정책, 승인, 훅, 세션
  컨텍스트, 감사 경로를 거칩니다.
- 명확한 실패 모드: 코드 모드가 명시적으로 활성화되었지만 런타임을 사용할 수
  없으면 OpenClaw는 광범위한 직접 도구 노출로 폴백하는 대신 닫힌 상태로
  실패합니다.

코드 모드는 활성화된 도구 카탈로그가 큰 에이전트나, 모델이 답변을 생성하기
전에 도구를 반복적으로 검색하고 결합하고 호출해야 하는 워크플로에 특히
유용합니다.

## 활성화 방법

에이전트 또는 런타임 구성에 `tools.codeMode.enabled: true`를 추가합니다.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

축약형도 허용됩니다.

```json5
{
  tools: {
    codeMode: true,
  },
}
```

`tools.codeMode`가 생략되었거나, `false`이거나, `enabled: true`가 없는 객체인
경우 코드 모드는 계속 꺼져 있습니다.

구성된 MCP 서버가 있는 샌드박스 에이전트를 사용할 때는 샌드박스 도구 정책이
번들 MCP Plugin도 허용하는지 확인하세요. 예를 들면
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`를 사용할 수 있습니다.
[구성 - 도구 및 사용자 지정 공급자](/ko/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)를
참조하세요.

더 엄격한 경계가 필요하면 명시적인 제한을 사용하세요.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

디버깅 중 모델 페이로드 형태를 확인하려면 대상 로깅과 함께 Gateway를
실행하세요.

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

코드 모드가 활성화되어 있으면 기록된 모델 대상 도구 이름은 `exec`와
`wait`이어야 합니다. 수정된 공급자 페이로드가 필요하면 짧은 디버깅 세션 동안
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`를 추가하세요.

## 기술 둘러보기

이 페이지의 나머지 부분은 런타임 계약과 구현 세부 정보를 설명합니다.
유지관리자, 도구 노출을 디버깅하는 Plugin 작성자, 고위험 배포를 검증하는
운영자를 대상으로 합니다.

## 런타임 상태

- 런타임: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- 기본 상태: 비활성화됨.
- 안정성: 실험적인 OpenClaw 표면입니다. Codex Code mode는 별도의 안정적인
  Codex 하네스 표면입니다.
- 대상 표면: 범용 OpenClaw 에이전트 실행.
- 보안 태세: 모델 코드는 적대적입니다.
- 사용자 대상 약속: 코드 모드를 활성화해도 광범위한 직접 도구 노출로 조용히
  폴백하지 않습니다.

## 범위

코드 모드는 준비된 실행의 모델 대상 오케스트레이션 형태를 소유합니다. 모델
선택, 채널 동작, 인증, 도구 정책 또는 도구 구현은 소유하지 않습니다.

범위에 포함:

- 모델에 표시되는 `exec` 및 `wait` 도구 정의
- 숨겨진 도구 카탈로그 구성
- JavaScript 및 TypeScript 게스트 실행
- QuickJS-WASI 워커 런타임
- 카탈로그 검색, 스키마 설명, 도구 호출을 위한 호스트 콜백
- 일시 중단된 게스트 프로그램을 위한 재개 가능한 상태
- 출력, 시간 초과, 메모리, 대기 중 호출, 스냅샷 제한
- 중첩 도구 호출에 대한 텔레메트리 및 궤적 투영

범위에서 제외:

- 공급자 네이티브 원격 코드 실행
- 셸 실행 의미 체계
- 기존 도구 권한 부여 변경
- 지속적인 사용자 작성 스크립트
- 게스트 코드의 패키지 관리자, 파일, 네트워크 또는 모듈 접근
- Codex Code mode 내부 구현의 직접 재사용

원격 Python 샌드박스와 같은 공급자 소유 도구는 별도 도구로 유지됩니다.
[코드 실행](/ko/tools/code-execution)을 참조하세요.

## 용어

**코드 모드**는 일반 모델 도구를 숨기고 `exec`와 `wait`만 노출하는 OpenClaw
런타임 모드입니다.

**게스트 런타임**은 모델 코드를 평가하는 QuickJS-WASI JavaScript VM입니다.

**호스트 브리지**는 게스트 코드에서 OpenClaw로 돌아오는 좁은 JSON 호환 콜백
표면입니다.

**카탈로그**는 일반 도구 정책, Plugin, MCP, 클라이언트 도구 해결 이후의
실행 범위 유효 도구 목록입니다.

**중첩 도구 호출**은 호스트 브리지를 통해 게스트 코드에서 수행되는 도구
호출입니다.

**스냅샷**은 `wait`가 일시 중단된 코드 모드 실행을 계속할 수 있도록 저장된
직렬화된 QuickJS-WASI VM 상태입니다.

## 구성

`tools.codeMode.enabled`는 활성화 게이트입니다. 다른 코드 모드 필드를 설정해도
기능은 활성화되지 않습니다.

지원되는 필드:

- `enabled`: boolean. 기본값 `false`. `true`일 때만 코드 모드를 활성화합니다.
- `runtime`: `"quickjs-wasi"`. 유일하게 지원되는 런타임입니다.
- `mode`: `"only"`. `exec`와 `wait`를 노출하고 일반 모델 도구를 숨깁니다.
- `languages`: `"javascript"`와 `"typescript"`의 배열. 기본값에는 둘 다
  포함됩니다.
- `timeoutMs`: 하나의 `exec` 또는 `wait`에 대한 실제 경과 시간 상한. 기본값
  `10000`. 런타임 제한: `100`에서 `60000`.
- `memoryLimitBytes`: QuickJS 힙 상한. 기본값 `67108864`. 런타임 제한:
  `1048576`에서 `1073741824`.
- `maxOutputBytes`: 반환되는 텍스트, JSON, 로그의 상한. 기본값 `65536`.
  런타임 제한: `1024`에서 `10485760`.
- `maxSnapshotBytes`: 직렬화된 VM 스냅샷의 상한. 기본값 `10485760`.
  런타임 제한: `1024`에서 `268435456`.
- `maxPendingToolCalls`: 동시 중첩 도구 호출의 상한. 기본값 `16`.
  런타임 제한: `1`에서 `128`.
- `snapshotTtlSeconds`: 일시 중단된 VM을 재개할 수 있는 시간. 기본값 `900`.
  런타임 제한: `1`에서 `86400`.
- `searchDefaultLimit`: 기본 숨겨진 카탈로그 검색 결과 수. 기본값 `8`.
  런타임은 이를 `maxSearchLimit`로 제한합니다.
- `maxSearchLimit`: 최대 숨겨진 카탈로그 검색 결과 수. 기본값 `50`.
  런타임 제한: `1`에서 `50`.

코드 모드가 활성화되었지만 QuickJS-WASI를 로드할 수 없으면 OpenClaw는 해당
실행에 대해 닫힌 상태로 실패합니다. 일반 도구를 폴백으로 조용히 노출하지
않습니다.

## 활성화

코드 모드는 유효 도구 정책이 알려진 뒤, 최종 모델 요청이 조립되기 전에
평가됩니다.

활성화 순서:

1. 에이전트, 모델, 공급자, 샌드박스, 채널, 발신자, 실행 정책을 해결합니다.
2. 유효 OpenClaw 도구 목록을 빌드합니다.
3. 적격 Plugin, MCP, 클라이언트 도구를 추가합니다.
4. 허용 및 거부 정책을 적용합니다.
5. `tools.codeMode.enabled`가 false이면 일반 도구 노출로 계속합니다.
6. 활성화되어 있고 실행에 도구가 활성 상태이면 유효 도구를 코드 모드
   카탈로그에 등록합니다.
7. 모델에 표시되는 도구 목록에서 모든 일반 도구를 제거합니다.
8. 코드 모드 `exec`와 `wait`를 추가합니다.

원시 모델 호출, `disableTools`, 빈 허용 목록처럼 의도적으로 도구가 없는 실행은
구성에 `tools.codeMode.enabled: true`가 포함되어 있어도 코드 모드 표면을
활성화하지 않습니다.

코드 모드 카탈로그는 실행 범위입니다. 다른 에이전트, 세션, 발신자 또는
실행의 도구가 누출되어서는 안 됩니다.

## 모델에 표시되는 도구

코드 모드가 활성화되면 모델은 정확히 다음 최상위 도구를 봅니다.

- `exec`
- `wait`

활성화된 다른 모든 도구는 모델 대상 도구 목록에서 숨겨지고 코드 모드
카탈로그에 등록됩니다.

모델은 도구 오케스트레이션, 데이터 조인, 루프, 병렬 중첩 호출, 구조화된
변환에 `exec`를 사용해야 합니다. 모델은 `exec`가 재개 가능한 `waiting` 결과를
반환할 때만 `wait`를 사용해야 합니다.

## `exec`

`exec`는 코드 모드 셀을 시작하고 하나의 결과를 반환합니다. 입력 코드는 모델이
생성하며 적대적인 것으로 취급해야 합니다.

입력:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

입력 규칙:

- `code` 또는 `command` 중 하나는 비어 있지 않아야 합니다.
- `code`는 문서화된 모델 대상 필드입니다.
- `command`는 훅 정책 및 신뢰할 수 있는 재작성에 대해 exec 호환 별칭으로
  허용됩니다. 둘 다 있으면 값이 일치해야 합니다.
- 외부 코드 모드 `exec` 훅 이벤트에는 `toolKind: "code_mode_exec"`가 포함되며,
  입력 언어를 알 수 있을 때 `toolInputKind: "javascript" | "typescript"`가
  포함됩니다. 따라서 정책은 같은 도구 이름을 공유하는 셸 스타일 `exec` 호출과
  코드 모드 셀을 구분할 수 있습니다.
- `language`의 기본값은 `"javascript"`입니다.
- `language`가 `"typescript"`이면 OpenClaw는 평가 전에 트랜스파일합니다.
- `exec`는 v1에서 `import`, `require`, 동적 import, 모듈 로더 패턴을
  거부합니다.
- `exec`는 일반 셸 `exec` 구현을 재귀적으로 노출하지 않습니다.

결과:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec`는 QuickJS VM이 재개 가능한 상태로 일시 중단되고, 모델에 표시되는 계속
작업이 아직 필요할 때 `waiting`을 반환합니다. 결과에는 `wait`를 위한 `runId`가
포함됩니다. MCP 네임스페이스 호출을 포함한 네임스페이스 브리지 호출은 준비되어
있는 동안 동일한 `exec`/`wait` 호출 내부에서 자동으로 소진되므로, 간결한 코드
블록이 네임스페이스 await마다 모델 도구 호출 하나를 강제하지 않고도 `$api()`를
검사하고 MCP 도구를 호출할 수 있습니다.

`exec`는 게스트 VM에 보류 중인 작업이 없고 OpenClaw의 출력 어댑터가 실행된 뒤
최종 값이 JSON 호환일 때만 `completed`를 반환합니다.

## `wait`

`wait`는 일시 중단된 코드 모드 VM을 계속 실행합니다.

입력:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

출력은 `exec`가 반환하는 것과 같은 `CodeModeResult` 유니언입니다.

`wait`가 존재하는 이유는 중첩된 OpenClaw 도구가 느리거나, 대화형이거나, 승인
게이트가 있거나, 부분 업데이트를 스트리밍할 수 있기 때문입니다. 모델은 호스트가
외부 작업을 기다리는 동안 하나의 긴 `exec` 호출을 계속 열어 둘 필요가 없어야
합니다.

QuickJS-WASI 스냅샷 및 복원은 v1 재개 메커니즘입니다.

1. `exec`는 완료, 실패 또는 일시 중단될 때까지 코드를 평가합니다.
2. 일시 중단 시 OpenClaw는 QuickJS VM의 스냅샷을 만들고 보류 중인 호스트
   작업을 기록합니다.
3. 보류 중인 작업이 안정되면 `wait`가 VM 스냅샷을 복원합니다.
4. OpenClaw는 안정적인 이름으로 호스트 콜백을 다시 등록합니다.
5. OpenClaw는 중첩된 도구 결과를 복원된 VM으로 전달합니다.
6. OpenClaw는 QuickJS 보류 작업을 비웁니다.
7. `wait`는 `completed`, `failed` 또는 또 다른 `waiting` 결과를 반환합니다.

스냅샷은 사용자 아티팩트가 아니라 런타임 상태입니다. 스냅샷은 크기가 제한되고,
만료되며, 이를 만든 실행 및 세션으로 범위가 지정됩니다.

`wait`는 다음 경우 실패합니다.

- `runId`를 알 수 없습니다.
- 스냅샷이 만료되었습니다.
- 상위 실행 또는 세션이 중단되었습니다.
- 호출자가 같은 실행/세션 범위에 없습니다.
- QuickJS-WASI 복원이 실패합니다.
- 복원하면 구성된 제한을 초과합니다.

## 게스트 런타임 API

게스트 런타임은 작은 전역 API를 노출합니다.

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS`는 실행 범위 카탈로그의 간결한 메타데이터입니다. 기본적으로 전체
스키마를 포함하지 않습니다.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

전체 스키마는 요청 시에만 로드됩니다.

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

카탈로그 헬퍼:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

편의 도구 함수는 모호하지 않은 안전한 이름에만 설치됩니다.

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

MCP 카탈로그 항목은 코드 모드에서 `tools.call(...)` 또는 편의 함수로 호출할 수
없습니다. 생성된 `MCP` 네임스페이스를 통해서만 노출됩니다. TypeScript 스타일
선언 파일은 읽기 전용 `API` 가상 파일 표면을 통해 사용할 수 있으므로, 에이전트는
프롬프트에 MCP 스키마를 추가하지 않고도 MCP 시그니처를 검사할 수 있습니다.

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")`는 MCP 도구 메타데이터에서 추론한 간결한 선언을
반환합니다.

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

선언 파일은 가상 파일이며, 워크스페이스나 상태 디렉터리 아래에 기록되는 파일이
아닙니다. 각 코드 모드 `exec` 호출마다 OpenClaw는 실행 범위 도구 카탈로그를
만들고, 표시되는 MCP 항목을 유지하며, 표시되는 서버마다 `mcp/index.d.ts`와
`mcp/<server>.d.ts` 선언 하나를 렌더링한 뒤, 그 작은 읽기 전용 테이블을 QuickJS
워커에 주입합니다. 게스트 코드는 `API` 객체만 봅니다. `API.list(prefix?)`는 파일
메타데이터를 반환하고 `API.read(path)`는 선택한 선언 콘텐츠를 반환합니다. 알 수
없는 경로와 `.` / `..` 세그먼트는 거부됩니다.

이 방식은 큰 MCP 스키마를 모델 프롬프트 밖에 둡니다. 에이전트는 `exec` 도구
설명에서 가상 API가 있음을 학습하고, 필요한 선언 파일만 읽은 다음,
`MCP.<server>.<tool>()`을 하나의 객체 인수로 호출합니다. 프로그램 안에서
에이전트가 단일 도구 스키마 응답이 필요할 때는 `MCP.<server>.$api()`를 인라인
대체 경로로 계속 사용할 수 있습니다.

게스트 런타임은 호스트 객체를 직접 노출해서는 안 됩니다. 입력과 출력은 명시적
크기 제한이 있는 JSON 호환 값으로 브리지를 건넙니다.

## 내부 네임스페이스

내부 네임스페이스는 모델에 표시되는 도구를 더 추가하지 않고 코드 모드에 간결한
도메인 API를 제공합니다. 로더가 소유한 통합은 `Issues`, `Fictions` 또는
`Calendar` 같은 네임스페이스를 등록할 수 있습니다. 그러면 게스트 코드는 QuickJS
프로그램 안에서 해당 네임스페이스를 호출하고, OpenClaw는 모델에 여전히 `exec`와
`wait`만 표시합니다.

네임스페이스는 현재 내부용입니다. 공개 Plugin SDK 네임스페이스 API는 없습니다.
외부 Plugin 네임스페이스에는 로더가 소유한 계약이 필요합니다. 그래야 Plugin
ID, 설치된 매니페스트, 인증 상태, 캐시된 카탈로그 설명자가 네임스페이스를
뒷받침하는 Plugin 도구와 어긋나지 않습니다. 코어 코드 모드는 샌드박스, 직렬화,
카탈로그 게이팅, 브리지 디스패치만 소유합니다.

게스트 코드는 직접 전역 또는 `namespaces` 맵을 사용할 수 있습니다.

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### 레지스트리 수명 주기

네임스페이스 레지스트리는 프로세스 로컬이며 네임스페이스 ID로 키가 지정됩니다.
일반적인 실행은 다음 경로를 따릅니다.

1. 신뢰할 수 있는 로더가 `registerCodeModeNamespaceForPlugin(pluginId, registration)`을 호출합니다.
2. 코드 모드는 실행을 위한 숨겨진 `ToolSearchRuntime`을 만들고 실행 범위
   카탈로그를 읽습니다.
3. `createCodeModeNamespaceRuntime(ctx, catalog)`는 `requiredToolNames`가 모두
   표시되고 같은 `pluginId`가 소유한 등록만 유지합니다.
4. 표시되는 각 네임스페이스는 현재 실행에 대해 `createScope(ctx)`를 호출합니다.
   스코프는 `agentId`, `sessionKey`, `sessionId`, `runId`, 구성, 중단 상태 같은
   실행 컨텍스트를 받습니다.
5. 스코프 데이터는 일반 설명자로 직렬화되어 직접 전역 및
   `namespaces.<globalName>`으로 QuickJS에 주입됩니다.
6. 게스트 호출은 워커 브리지를 통해 일시 중단되고, 호스트에서 네임스페이스
   경로를 확인하며, 호출을 선언된 Plugin 소유 카탈로그 도구로 매핑하고,
   `ToolSearchRuntime.call`을 통해 해당 도구를 실행합니다.
7. OpenClaw는 활성 `exec`/`wait` 도구 호출 안에서 준비된 네임스페이스 브리지
   호출을 자동으로 비웁니다. 제한 시간에 네임스페이스 작업이 아직 보류 중이거나
   게스트가 명시적으로 양보하면, `wait`가 나중에 같은 네임스페이스 런타임을
   재개합니다.
8. Plugin 롤백 또는 제거는 `clearCodeModeNamespacesForPlugin(pluginId)`를
   호출하여 오래된 전역이 실패한 Plugin 로드 뒤에도 남지 않게 합니다.

중요한 불변 조건: 네임스페이스 호출은 카탈로그 도구 호출입니다. 네임스페이스
호출은 `tools.call(...)`과 같은 정책 훅, 승인, 중단 처리, 텔레메트리, 트랜스크립트
투영, 일시 중단/재개 동작을 사용합니다.

### 등록 형태

뒷받침하는 도구를 소유한 통합에서 네임스페이스를 등록하세요. 스코프를 작게
유지하고 선언된 카탈로그 도구에 매핑되는 도메인 동사만 노출하세요.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)`는 스코프 멤버를 호출 가능한
네임스페이스 함수로 표시합니다. 선택적 `inputMapper`는 게스트 인수를 받고
뒷받침하는 카탈로그 도구의 입력 객체를 반환합니다. 입력 매퍼가 없으면 첫 번째
게스트 인수가 사용되며, 생략된 경우 `{}`가 사용됩니다.

원시 호스트 함수는 게스트 코드가 실행되기 전에 거부됩니다.

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### 소유권 및 가시성

네임스페이스 소유권은 등록 호출자의 `pluginId`에 바인딩됩니다.
`requiredToolNames`는 가시성 게이트이자 소유권 검사입니다.

- 모든 필수 도구는 실행 카탈로그에 있어야 합니다.
- 모든 필수 도구는 `sourceName === pluginId`여야 합니다.
- 필수 도구가 없거나 다른 Plugin이 소유하면 네임스페이스는 숨겨집니다.
- 각 호출 가능한 경로는 `requiredToolNames`에 이름이 있는 도구만 대상으로 할 수 있습니다.

이렇게 하면 다른 Plugin이 같은 이름의 도구를 등록하여 네임스페이스를 노출하는
것을 방지합니다. 또한 네임스페이스를 일반 에이전트 정책과 정렬된 상태로
유지합니다. 실행이 뒷받침하는 도구를 볼 수 없으면 네임스페이스도 볼 수 없습니다.

예를 들어 GitHub 네임스페이스는 GitHub 인증, REST 또는 GraphQL 클라이언트,
속도 제한, 쓰기 승인, 테스트를 소유하는 GitHub 소유 확장 뒤에 있어야 합니다.
코어 코드 모드는 GitHub별 API, 토큰 처리 또는 제공자 정책을 포함해서는 안
됩니다.

### 스코프 직렬화 규칙

`createScope(ctx)`는 JSON 호환 값, 배열, 중첩 객체, 그리고
`createCodeModeNamespaceTool(...)` 호출 마커를 포함하는 일반 객체를 반환할 수
있습니다. 호스트 객체는 QuickJS에 직접 들어가지 않습니다.

직렬화기는 다음을 거부합니다.

- 원시 함수
- 순환 객체 그래프
- 안전하지 않은 경로 세그먼트: `__proto__`, `constructor`, `prototype`, 빈 키 또는
  내부 경로 구분자를 포함하는 키
- JavaScript 식별자가 아닌 `globalName` 값
- `tools`, `namespaces`, `text`, `json`, `yield_control` 또는 `__openclaw*` 같은
  기본 제공 코드 모드 전역과 충돌하는 `globalName`

JSON으로 직렬화할 수 없는 값은 브리지를 건너기 전에 JSON 안전 대체 값으로
변환됩니다. 바이너리 데이터, 핸들, 소켓, 클라이언트, 클래스 인스턴스는 일반
카탈로그 도구 뒤에 있어야 합니다.

### 프롬프트

네임스페이스 `description`과 선택적 `prompt`는 해당 실행에서 네임스페이스가
표시될 때만 모델에 표시되는 `exec` 스키마에 추가됩니다. 이를 사용해 가장 작은
유용한 표면을 학습시키세요.

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

프롬프트는 인증 설정, 구현 이력 또는 관련 없는 Plugin 동작이 아니라
네임스페이스 계약에 관한 내용으로 유지하세요.

### 정리

네임스페이스는 프로세스 로컬 등록입니다. 소유 Plugin이 비활성화, 제거 또는 롤백될 때 제거하세요.

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

코드 모드 정리는 Plugin이 소유합니다. 네임스페이스별 해제 핸들을 유지하는 대신 수명 주기가 끝날 때 Plugin의 네임스페이스 등록을 지우세요. 테스트는 케이스 간 등록 누수를 방지하기 위해 `clearCodeModeNamespacesForTest()`를 호출할 수 있습니다.

### 테스트 체크리스트

네임스페이스 변경은 보안 경계와 게스트 동작을 포함해야 합니다.

- 지원 도구가 표시될 때만 네임스페이스 프롬프트 텍스트가 나타남
- 다른 `sourceName`의 같은 이름 도구가 네임스페이스를 노출하지 않음
- 원시 범위 함수가 거부됨
- 위조된 네임스페이스 id와 위조된 경로가 거부됨
- 호출 가능한 경로가 선언되지 않은 도구를 대상으로 할 수 없음
- 중첩 객체와 공유 참조가 올바르게 직렬화됨
- 네임스페이스 호출이 카탈로그 도구를 통해 실행되고 JSON 안전 세부 정보를 반환함
- 실패를 게스트 코드에서 잡을 수 있음
- 일시 중단된 네임스페이스 호출이 `wait`를 통해 재개됨
- Plugin 롤백이 소유 네임스페이스 등록을 지움

네임스페이스는 일반 `tools.search` / `tools.call` 카탈로그를 보완합니다. 임의로 활성화된 OpenClaw, Plugin, 클라이언트 도구에는 카탈로그를 사용하고, MCP 도구에는 `MCP`를 사용하며, 반복적인 스키마 조회보다 간결한 코드가 더 안정적인 Plugin 소유의 문서화된 도메인 API에는 다른 네임스페이스를 사용하세요.

## 출력 API

`text(value)`는 사람이 읽을 수 있는 출력을 `output` 배열에 추가합니다.

`json(value)`는 JSON 호환 직렬화 후 구조화된 출력 항목을 추가합니다.

게스트 코드가 최종적으로 반환한 값은 `completed` 결과의 `value`가 됩니다.

출력 항목:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

출력 규칙:

- 출력 순서는 게스트 호출과 일치함
- 출력은 `maxOutputBytes`로 제한됨
- 직렬화할 수 없는 값은 일반 문자열이나 오류로 변환됨
- 바이너리 값은 v1에서 지원되지 않음
- 이미지와 파일은 코드 모드 브리지를 통하지 않고 일반 OpenClaw 도구를 통해 이동함

## 도구 카탈로그

숨겨진 카탈로그에는 유효 정책 필터링 후의 도구가 포함됩니다.

1. OpenClaw 코어 도구.
2. 번들 Plugin 도구.
3. 외부 Plugin 도구.
4. MCP 도구.
5. 현재 실행을 위해 클라이언트가 제공한 도구.

카탈로그 id는 하나의 실행 내에서 안정적이며, 가능하면 동등한 도구 집합 간에 결정적입니다.

권장 id 형식:

```text
<source>:<owner>:<tool-name>
```

예:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

카탈로그는 코드 모드 제어 도구를 생략합니다.

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

이렇게 하면 재귀를 방지하고 모델 대상 계약을 좁게 유지할 수 있습니다.

MCP 항목은 실행 범위 카탈로그에 남아 정책, 승인, 훅, 텔레메트리, 트랜스크립트 프로젝션, 정확한 도구 id가 일반 도구 실행과 공유되도록 합니다. 게스트 대상 `ALL_TOOLS`, `tools.search(...)`, `tools.describe(...)`, `tools.call(...)` 뷰는 MCP 항목을 생략합니다. 생성된 `MCP.<server>.<tool>({ ...input })` 네임스페이스는 정확한 카탈로그 id로 다시 해석된 뒤 동일한 실행기 경로를 통해 디스패치됩니다.

## 도구 검색 상호작용

코드 모드는 활성화된 실행에서 OpenClaw 도구 검색 모델 표면을 대체합니다.

`tools.codeMode.enabled`가 true이고 코드 모드가 활성화되면:

- OpenClaw는 `tool_search_code`, `tool_search`, `tool_describe`, `tool_call`을 모델에 표시되는 도구로 노출하지 않습니다.
- 동일한 카탈로그화 개념이 게스트 런타임 내부로 이동합니다.
- 게스트 런타임은 비 MCP 도구에 대한 압축된 `ALL_TOOLS` 메타데이터와 검색, 설명, 호출 헬퍼를 받습니다.
- MCP 호출은 `tools.call(...)` 대신 생성된 `MCP` 네임스페이스와 그 `$api()` 헤더를 사용합니다.
- 중첩 호출은 도구 검색이 사용하는 것과 동일한 OpenClaw 실행기 경로를 통해 디스패치됩니다.

기존 [도구 검색](/ko/tools/tool-search) 페이지는 OpenClaw 압축 카탈로그 브리지를 설명합니다. 코드 모드는 `exec`와 `wait`를 사용할 수 있는 실행을 위한 일반 OpenClaw 대안입니다.

## 도구 이름과 충돌

모델에 표시되는 `exec` 도구는 코드 모드 도구입니다. 일반 OpenClaw 셸 `exec` 도구가 활성화된 경우 모델에서는 숨겨지고 다른 도구처럼 카탈로그화됩니다.

게스트 런타임 내부:

- 정책이 허용하면 `tools.call("openclaw:core:exec", input)`이 셸 exec 도구를 호출할 수 있습니다.
- `tools.exec(...)`는 셸 exec 카탈로그 항목에 모호하지 않은 안전한 이름이 있을 때만 설치됩니다.
- 코드 모드 `exec` 도구는 `tools`를 통해 재귀적으로 사용할 수 없습니다.

두 도구가 동일한 안전 편의 이름으로 정규화되면 OpenClaw는 편의 함수를 생략하고 `tools.call(id, input)`을 요구합니다.

## 중첩 도구 실행

모든 중첩 도구 호출은 호스트 브리지를 건너 OpenClaw에 다시 진입합니다.

중첩 실행은 다음을 보존합니다.

- 활성 에이전트 id
- 세션 id와 세션 키
- 발신자 및 채널 컨텍스트
- 샌드박스 정책
- 승인 정책
- Plugin `before_tool_call` 훅
- abort 신호
- 사용 가능한 경우 스트리밍 업데이트
- 궤적 및 감사 이벤트

중첩 호출은 실제 도구 호출로 트랜스크립트에 프로젝션되므로 지원 번들이 무슨 일이 일어났는지 표시할 수 있습니다. 프로젝션은 부모 코드 모드 도구 호출과 중첩 도구 id를 식별합니다.

병렬 중첩 호출은 `maxPendingToolCalls`까지 허용됩니다.

## 런타임 상태

각 코드 모드 실행에는 상태 머신이 있습니다.

- `running`: VM이 실행 중이거나 중첩 호출이 진행 중입니다.
- `waiting`: VM 스냅샷이 존재하며 `wait`로 재개할 수 있습니다.
- `completed`: 최종 값이 반환되었고 스냅샷이 삭제되었습니다.
- `failed`: 오류가 반환되었고 스냅샷이 삭제되었습니다.
- `expired`: 스냅샷 또는 보류 상태가 보존 기간을 초과했으며 재개할 수 없습니다.
- `aborted`: 부모 실행/세션이 취소되었고 스냅샷이 삭제되었습니다.

상태는 에이전트 실행, 세션, 도구 호출 id로 범위가 지정됩니다. 다른 실행 또는 세션의 `wait` 호출은 실패합니다.

스냅샷 저장소는 제한됩니다.

- 실행당 최대 스냅샷 바이트
- 프로세스당 최대 라이브 스냅샷 수
- 스냅샷 TTL
- 실행 종료 시 정리
- 지속성이 지원되지 않는 경우 Gateway 종료 시 정리

## QuickJS-WASI 런타임

OpenClaw는 소유 패키지에서 직접 의존성으로 `quickjs-wasi`를 로드합니다. 런타임은 프록시, PAC 또는 관련 없는 다른 의존성을 위해 설치된 전이 복사본에 의존하지 않습니다.

런타임 책임:

- QuickJS-WASI WebAssembly 모듈 컴파일 또는 로드
- 코드 모드 실행 또는 재개마다 격리된 VM 하나 생성
- 안정적인 이름으로 호스트 콜백 등록
- 메모리 및 인터럽트 제한 설정
- JavaScript 평가
- 보류 중인 작업 비우기
- 일시 중단된 VM 상태 스냅샷 생성
- `wait`를 위한 스냅샷 복원
- 터미널 상태 이후 VM 핸들과 스냅샷 폐기

런타임은 워커에서 OpenClaw의 메인 이벤트 루프 밖에서 실행됩니다. 게스트 무한 루프가 Gateway 프로세스를 무기한 차단해서는 안 됩니다.

## TypeScript

TypeScript 지원은 소스 변환만 수행합니다.

- 허용되는 입력: TypeScript 코드 문자열 하나
- 출력: QuickJS-WASI가 평가하는 JavaScript 문자열
- 타입 검사 없음
- 모듈 해석 없음
- v1에서 `import` 또는 `require` 없음
- 진단은 `failed` 결과로 반환됨

TypeScript 컴파일러는 TypeScript 셀에 대해서만 지연 로드됩니다. 일반 JavaScript 셀과 비활성화된 코드 모드는 컴파일러를 로드하지 않습니다.

변환은 가능한 경우 유용한 줄 번호를 보존해야 합니다.

## 보안 경계

모델 코드는 적대적입니다. 런타임은 심층 방어를 사용합니다.

- 메인 이벤트 루프 밖에서 QuickJS-WASI 실행
- Codex나 전이 패키지를 통하지 않고 직접 의존성으로 `quickjs-wasi` 로드
- 게스트에 파일 시스템, 네트워크, 하위 프로세스, 모듈 import, 환경 변수 또는 호스트 전역 객체 없음
- QuickJS 메모리 및 인터럽트 제한 사용
- 부모 프로세스 벽시계 시간 제한 강제
- 출력, 스냅샷, 로그, 보류 호출 상한 강제
- 좁은 JSON 어댑터를 통해 호스트 브리지 값 직렬화
- 호스트 오류를 일반 게스트 오류로 변환하고 호스트 realm 객체는 절대 전달하지 않음
- 시간 초과, abort, 세션 종료 또는 만료 시 스냅샷 삭제
- `exec`, `wait`, 도구 검색 제어 도구에 대한 재귀 접근 거부
- 편의 이름 충돌이 카탈로그 헬퍼를 가리지 못하게 방지

샌드박스는 하나의 보안 계층입니다. 운영자는 고위험 배포를 위해 OS 수준 강화가 여전히 필요할 수 있습니다.

## 오류 코드

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

게스트에 반환되는 오류는 일반 데이터입니다. 호스트 `Error` 인스턴스, 스택 객체, 프로토타입, 호스트 함수는 QuickJS로 넘어가지 않습니다.

## 텔레메트리

코드 모드는 다음을 보고합니다.

- 모델에 전송된 표시 도구 이름
- 숨겨진 카탈로그 크기와 소스별 분류
- `exec` 및 `wait` 횟수
- 중첩 검색, 설명, 호출 횟수
- 호출된 중첩 도구 id
- 시간 초과, 메모리, 스냅샷, 출력 상한 실패
- 스냅샷 수명 주기 이벤트

텔레메트리에는 기존 OpenClaw 궤적 정책을 넘어서는 비밀, 원시 환경 값 또는 수정되지 않은 도구 입력이 포함되어서는 안 됩니다.

## 디버깅

코드 모드가 일반 도구 실행과 다르게 동작할 때는 대상 모델 전송 로깅을 사용하세요.

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

페이로드 형식 디버깅에는 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`를 사용하세요. 이는 모델 요청의 제한되고 수정된 JSON 스냅샷을 기록합니다. 프롬프트와 메시지 텍스트가 여전히 나타날 수 있으므로 디버깅 중에만 사용해야 합니다.

스트림 디버깅에는 `OPENCLAW_DEBUG_SSE=peek`를 사용하여 처음 다섯 개의 수정된 SSE 이벤트를 기록하세요. 코드 모드 표면이 활성화된 후 최종 제공자 페이로드에 정확히 `exec`와 `wait`가 포함되어 있지 않으면 코드 모드는 실패로 닫힙니다.

## 구현 레이아웃

구현 단위:

- config 계약: `tools.codeMode`
- 카탈로그 빌더: 유효 도구를 압축 항목과 id 맵으로 변환
- 모델 표면 어댑터: 표시 도구를 `exec`와 `wait`로 교체
- QuickJS-WASI 런타임 어댑터: 로드, 평가, 스냅샷, 복원, 폐기
- 워커 감독자: 시간 초과, abort, 충돌 격리
- 브리지 어댑터: JSON 안전 호스트 콜백과 결과 전달
- TypeScript 변환 어댑터
- 스냅샷 저장소: TTL, 크기 상한, 실행/세션 범위 지정
- 중첩 도구 호출의 궤적 프로젝션
- 텔레메트리 카운터와 진단

구현은 도구 검색의 카탈로그 및 실행기 개념을 재사용하지만, 샌드박스로 `node:vm` 자식을 사용하지 않습니다.

## 검증 체크리스트

코드 모드 커버리지는 다음을 증명해야 합니다.

- 비활성화된 구성은 기존 도구 노출을 변경하지 않습니다
- `enabled: true`가 없는 객체 구성은 코드 모드를 비활성화된 상태로 둡니다
- 활성화된 구성은 실행에서 도구가 활성 상태일 때 모델에 `exec`와 `wait`만 노출합니다
- 원시 무도구 실행, `disableTools`, 빈 허용 목록은 코드 모드
  페이로드 강제 적용을 트리거하지 않습니다
- 모든 유효한 비-MCP 도구가 `ALL_TOOLS`에 나타납니다
- 거부된 도구는 `ALL_TOOLS`에 나타나지 않습니다
- `tools.search`, `tools.describe`, `tools.call`은 OpenClaw 도구에서 작동합니다
- `API.list("mcp")`와 `API.read("mcp/<server>.d.ts")`는 브리지/도구 호출 없이 TypeScript 스타일
  MCP 선언을 노출합니다
- MCP 네임스페이스 `$api()`는 스키마용 인라인 대체 경로로 계속 사용할 수 있습니다
- MCP 네임스페이스 호출은 하나의 객체 입력을 받는 표시 가능한 MCP 도구에서 작동하지만,
  직접 MCP 카탈로그 항목은 `tools.*`에 없습니다
- Tool Search 제어 도구는 모델 표면과 숨겨진
  카탈로그 모두에서 숨겨집니다
- 중첩 호출은 승인 및 훅 동작을 보존합니다
- 셸 `exec`는 모델에서 숨겨지지만 허용된 경우 카탈로그 id로 호출할 수 있습니다
- 재귀 코드 모드 `exec`와 `wait`는 게스트 코드에서 호출할 수 없습니다
- TypeScript 입력은 비활성화된 경로 또는 JavaScript 전용 경로에서 TypeScript를 로드하지 않고
  변환 및 평가됩니다
- `import`, `require`, 파일 시스템, 네트워크, 환경 접근은 실패합니다
- 무한 루프는 시간 초과되며 Gateway를 차단할 수 없습니다
- 메모리 한도 실패는 게스트 VM을 종료합니다
- 완료된 호출과 일시 중단된 호출에 대해 출력 및 스냅샷 한도가 적용됩니다
- `wait`는 일시 중단된 스냅샷을 재개하고 최종 값을 반환합니다
- 만료됨, 중단됨, 잘못된 세션, 알 수 없는 `runId` 값은 실패합니다
- 트랜스크립트 재생 및 지속성은 코드 모드 제어 호출을 보존합니다
- 트랜스크립트와 텔레메트리는 중첩 도구 호출을 명확히 표시합니다

## E2E 테스트 계획

런타임을 변경할 때 다음을 통합 테스트 또는 엔드투엔드 테스트로 실행하세요.

1. `tools.codeMode.enabled: false`로 Gateway를 시작합니다.
2. 작은 직접 도구 세트로 에이전트 턴을 보냅니다.
3. 모델에 표시되는 도구가 변경되지 않았는지 확인합니다.
4. `tools.codeMode.enabled: true`로 다시 시작합니다.
5. OpenClaw, Plugin, MCP, 클라이언트 테스트 도구로 에이전트 턴을 보냅니다.
6. 모델에 표시되는 도구 목록이 정확히 `exec`, `wait`인지 확인합니다.
7. `exec`에서 `ALL_TOOLS`를 읽고 유효한 테스트 도구가 있는지 확인합니다.
8. `exec`에서 `tools.search`,
   `tools.describe`, `tools.call`을 통해 OpenClaw/Plugin/클라이언트 도구를 호출합니다.
9. `exec`에서 `API.list("mcp")`와 `API.read("mcp/<server>.d.ts")`를 호출하고
   선언 파일이 표시 가능한 MCP 도구를 설명하는지 확인합니다.
10. `exec`에서 `MCP.<server>.<tool>({ ...input })`을 통해 MCP 도구를 호출하고
    직접 MCP 카탈로그 항목이 `ALL_TOOLS`와 `tools.*`에 없는지 확인합니다.
11. 거부된 도구가 없고 추측한 id로 호출할 수 없는지 확인합니다.
12. `exec`가 `waiting`을 반환한 뒤 해결되는 중첩 도구 호출을 시작합니다.
13. `wait`를 호출하고 복원된 VM이 도구 결과를 받는지 확인합니다.
14. 최종 답변에 복원 후 생성된 출력이 포함되어 있는지 확인합니다.
15. 시간 초과, 중단, 스냅샷 만료가 런타임 상태를 정리하는지 확인합니다.
16. trajectory를 내보내고 중첩 호출이 상위
    코드 모드 호출 아래에 표시되는지 확인합니다.

이 페이지의 문서 전용 변경에도 `pnpm check:docs`를 실행해야 합니다.

## 관련

- [Tool Search](/ko/tools/tool-search)
- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [exec 도구](/ko/tools/exec)
- [코드 실행](/ko/tools/code-execution)
