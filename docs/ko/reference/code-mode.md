---
read_when:
    - 에이전트 실행에 OpenClaw 코드 모드를 활성화하려고 합니다
    - 코드 모드가 Codex Code 모드와 다른 이유를 설명해야 합니다.
    - 간결한 도구 계약, QuickJS-WASI 샌드박스, TypeScript 변환 또는 숨겨진 도구 카탈로그 브리지를 검토하고 있습니다.
    - 내부 코드 모드 네임스페이스 레지스트리 통합을 추가하거나 검토하고 있습니다
sidebarTitle: Code mode
summary: 'OpenClaw 코드 모드: QuickJS-WASI와 숨겨진 실행 범위 도구 카탈로그를 기반으로 하는 선택형 간소화 도구 인터페이스'
title: 코드 모드
x-i18n:
    generated_at: "2026-07-12T15:42:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb69afba5b1b204a78de0ccaf5f93922588db22ff8ee3faf40cc65af6c22f6be
    source_path: reference/code-mode.md
    workflow: 16
---

코드 모드는 실험적이며 명시적으로 활성화해야 하는 OpenClaw 에이전트 런타임 기능입니다. 이 기능을
활성화하면 모델은 더 이상 활성화된 모든 도구 스키마를 보지 않습니다. 대신
`exec`, `wait` 및 구조화된 결과가 JSON 전용 게스트 브리지를 통과할 수 없는
직접 전용 도구를 봅니다. 모델은 숨겨진 도구 카탈로그를 검색하고 설명하며
호출하는 작은 JavaScript 또는 TypeScript 프로그램을 작성합니다.

이 페이지에서는 Codex Code Mode가 아니라 OpenClaw 코드 모드를 설명합니다. 두 기능은
이름과 제어 도구 이름(`exec`, `wait`)이 같지만
서로 별개의 구현입니다.

- Codex Code Mode는 Codex 코딩 하네스 내부에서 실행됩니다. 이 기능의 `exec` 도구는
  자유 형식 문법 도구입니다. 모델이 원시 JavaScript 소스를 작성하며, 실행 옵션을 위한
  `// @exec: {...}` 프라그마 줄을 선택적으로 앞에 붙일 수 있고, 이 소스는
  Deno/V8 런타임에서 실행됩니다.
- OpenClaw 코드 모드는 일반 OpenClaw 에이전트 런타임에서 실행되며
  `tools.codeMode.enabled: true`를 구성하지 않으면 비활성화됩니다. 이 기능의 `exec`
  도구는 JSON `{ code, language }` 페이로드를 받으며, QuickJS-WASI
  워커에서 실행됩니다.

둘 다 JavaScript 실행 표면이며 셸 명령 실행 표면이 아닙니다. 이름이 동일한
`exec`/`wait` 도구를 노출할 뿐, 구현 방식이 서로 다른 독립적인 기능으로
취급하십시오.

## 기능

- 모델에 표시되는 도구 목록은 `exec`, `wait` 및 이미지 결과가 게스트 브리지를
  통과할 수 없는 `computer` 같은 직접 전용 도구로 구성됩니다.
- `exec`는 격리된 QuickJS-WASI 워커 스레드에서 모델이 생성한 JavaScript 또는
  TypeScript를 평가합니다.
- 카탈로그에 등록할 수 있는 모든 활성화된 도구(OpenClaw 코어, Plugin, MCP, 클라이언트)는
  모델 프롬프트에서 숨겨지고 게스트 프로그램 내부에서 `ALL_TOOLS`
  및 `tools`를 통해 노출됩니다.
- 게스트 코드는 숨겨진 카탈로그를 검색하고 도구의 스키마를 설명하며 일반 에이전트 턴에서
  사용하는 것과 동일한 실행 경로를 통해 도구를 호출합니다(정책,
  승인, 후크, 텔레메트리가 모두 계속 적용됩니다).
- MCP 도구는 `MCP` 네임스페이스 아래에 그룹화됩니다. 코드 모드에서는 이것이
  MCP 도구를 호출하는 유일하게 지원되는 방법입니다.
- 중첩된 도구 호출이 아직 대기 중이면 `wait`가 일시 중단된 코드 모드 실행을
  재개합니다.

코드 모드는 모델 대상 오케스트레이션 표면만 변경합니다. 도구, Plugin 도구,
MCP 도구, 인증, 승인 정책, 채널 동작 또는 모델 선택을
대체하지 않습니다.

## 사용하는 이유

- 더 작은 프롬프트 표면: 공급자는 수십 개 또는 수백 개의 전체 도구 스키마 대신
  두 개의 제어 도구와 필수적인 소수의 직접 도구만 받습니다.
- 향상된 오케스트레이션: 모델은 하나의 코드 셀 안에서 루프, 조인, 작은 변환,
  조건부 논리 및 병렬 중첩 도구 호출을 사용할 수 있습니다.
- 공급자 중립적: 공급자 네이티브 코드 실행에 의존하지 않고 OpenClaw, Plugin,
  MCP 및 클라이언트 도구에 사용할 수 있습니다.
- 실패 시 차단: 코드 모드가 활성화되어 있지만 QuickJS-WASI 런타임을
  사용할 수 없으면, 광범위한 직접 도구 노출로 조용히 대체하지 않고
  실행이 실패합니다.

활성화된 도구 카탈로그가 큰 에이전트나, 응답하기 전에 모델이 여러 도구를
검색하고 결합하고 호출해야 하는 워크플로에 가장 유용합니다.

## 활성화

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

축약형:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

`tools.codeMode`가 생략되었거나 `false`이거나 `enabled: true`가 없는 객체이면
코드 모드는 비활성화된 상태로 유지됩니다.

MCP 서버가 구성된 샌드박스 에이전트를 사용하는 경우, 샌드박스 도구 정책에서
번들 MCP Plugin도 허용하십시오. 예:
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. 자세한 내용은
[구성 - 도구 및 사용자 지정 공급자](/ko/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy)를 참조하십시오.

더 엄격한 제한을 적용하려면 명시적인 한도를 설정하십시오.

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

디버깅 중 모델 페이로드 형태를 확인하려면 대상 지정 로깅을 활성화하여 Gateway를
실행하십시오.

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

코드 모드가 활성화되면 로그에 기록되는 모델 대상 도구 이름은 `exec`와
`wait`여야 합니다. 마스킹된 전체 공급자 페이로드를 확인하려면 짧은 디버깅 세션 동안
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`를 추가하십시오.

## 기술 개요

이 페이지의 나머지 부분에서는 유지 관리자, 도구 노출을 디버깅하는 Plugin 작성자,
고위험 배포를 검증하는 운영자를 위해 런타임 계약과 구현 세부 정보를 설명합니다.

## 런타임 상태

|                     |                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------- |
| 런타임              | [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi)                               |
| 기본 상태           | 비활성화                                                                                    |
| 안정성              | 실험적 OpenClaw 표면(Codex Code Mode는 별도의 안정적인 Codex 하네스 표면)                   |
| 대상 표면           | 일반 OpenClaw 에이전트 실행                                                                 |
| 보안 태세           | 모델 코드는 적대적임                                                                        |
| 사용자 대상 보장 사항 | 코드 모드를 활성화해도 광범위한 직접 도구 노출로 조용히 대체되지 않음                       |

## 범위

코드 모드는 준비된 실행에 대한 모델 대상 오케스트레이션 형태를 담당합니다.
모델 선택, 채널 동작, 인증, 도구 정책 또는 도구 구현은 담당하지 않습니다.

범위 내: 모델에 표시되는 제어/직접 도구 정의, 숨겨진 도구 카탈로그
구성, JavaScript/TypeScript 게스트 실행, QuickJS-WASI 워커
런타임, 검색/설명/호출을 위한 호스트 콜백, 일시 중단된 게스트 프로그램의
재개 가능한 상태, 출력/시간 제한/메모리/대기 호출/스냅샷 한도,
중첩 도구 호출에 대한 텔레메트리/궤적 투영.

범위 외: 공급자 네이티브 원격 코드 실행, 셸 실행
의미 체계, 기존 도구 권한 부여 변경, 사용자가 작성한 영구
스크립트, 게스트 코드의 패키지 관리자/파일/네트워크/모듈 접근 및
Codex Code Mode 내부 구현의 직접 재사용.

원격 Python 샌드박스 같은 공급자 소유 도구는 별개의 도구입니다.
[코드 실행](/ko/tools/code-execution)을 참조하십시오.

## 용어

- **코드 모드**: 카탈로그와 호환되는 모델 도구를 숨기고 `exec`, `wait` 및
  필수 직접 전용 도구를 노출하는 OpenClaw 런타임 모드입니다.
- **게스트 런타임**: 모델 코드를 평가하는 QuickJS-WASI JavaScript VM입니다.
- **호스트 브리지**: 게스트 코드에서 OpenClaw로 돌아가는 제한적인 JSON 호환
  콜백 표면입니다.
- **카탈로그**: 일반 도구 정책, Plugin, MCP 및 클라이언트 도구 확인이
  완료된 후의 실행 범위 유효 도구 목록입니다.
- **중첩 도구 호출**: 게스트 코드가 호스트 브리지를 통해 수행하는 도구 호출입니다.
- **스냅샷**: `wait`가 일시 중단된 코드 모드 실행을 계속할 수 있도록 저장된
  직렬화된 QuickJS-WASI VM 상태입니다.

## 구성

`tools.codeMode.enabled`는 활성화 게이트입니다. 다른 필드를 설정하는 것만으로는
기능이 활성화되지 않습니다.

| 필드                  | 기본값                         | 제한                                            |
| --------------------- | ------------------------------ | ----------------------------------------------- |
| `enabled`             | `false`                        | 불리언, `true`만 코드 모드를 활성화             |
| `runtime`             | `"quickjs-wasi"`               | 유일하게 지원되는 값                            |
| `mode`                | `"only"`                       | 제어/직접 도구를 노출하고 나머지를 카탈로그화   |
| `languages`           | `["javascript", "typescript"]` | 두 언어의 임의 부분 집합                        |
| `timeoutMs`           | `10000`                        | `100`-`60000`                                   |
| `memoryLimitBytes`    | `67108864`                     | `1048576`-`1073741824`                          |
| `maxOutputBytes`      | `65536`                        | `1024`-`10485760`                               |
| `maxSnapshotBytes`    | `10485760`                     | `1024`-`268435456`                              |
| `maxPendingToolCalls` | `16`                           | `1`-`128`                                       |
| `snapshotTtlSeconds`  | `900`                          | `1`-`86400`                                     |
| `searchDefaultLimit`  | `8`                            | `maxSearchLimit`에 맞게 제한                    |
| `maxSearchLimit`      | `50`                           | `1`-`50`                                        |

코드 모드가 활성화되어 있지만 QuickJS-WASI를 로드할 수 없으면 OpenClaw는
해당 실행을 차단하여 실패시킵니다. 일반 도구를 대체 수단으로 조용히 노출하지 않습니다.

## 활성화 절차

코드 모드는 유효 도구 정책을 확인한 후 최종 모델 요청을 구성하기 전에
평가됩니다.

1. 에이전트, 모델, 공급자, 샌드박스, 채널, 발신자 및 실행
   정책을 확인합니다.
2. 적합한 Plugin, MCP 및 클라이언트 도구를 추가하여 유효한 OpenClaw 도구 목록을
   구성합니다.
3. 허용/거부 정책을 적용합니다.
4. `tools.codeMode.enabled`가 false이면 일반 도구 노출을 계속합니다.
5. 활성화되어 있고 실행에서 도구가 활성 상태이면 필수 직접 전용
   도구를 유지하고 카탈로그에 등록할 수 있는 모든 유효 도구를 코드 모드
   카탈로그에 등록합니다.
6. 카탈로그에 등록된 도구를 모델 표시 목록에서 제거하고 유지된 직접 전용 도구와
   함께 `exec` 및 `wait`를 추가합니다.

의도적으로 도구가 없는 실행(원시 모델 호출, `disableTools: true`
또는 빈 `tools.allow` 목록)은 `tools.codeMode.enabled: true`가 구성되어 있어도
코드 모드 표면을 활성화하지 않습니다. 코드 모드와 OpenClaw 도구
검색은 한 실행에서 상호 배타적입니다. 코드 모드가 활성화되면 도구 검색의
Compaction은 수행되지 않습니다.

코드 모드 카탈로그는 실행 범위로 한정되며 다른 에이전트, 세션, 발신자 또는
실행의 도구가 유출되어서는 안 됩니다.

## 모델에 표시되는 도구

코드 모드가 활성화되면 모델에는 `exec`, `wait` 및 필수
직접 전용 도구가 표시됩니다. 활성화된 다른 모든 도구는 모델 대상
도구 목록에서 숨겨지고 코드 모드 카탈로그에 등록됩니다.

도구 오케스트레이션, 데이터 조인, 루프, 병렬 중첩 호출 및 구조화된 변환에는
`exec`를 사용하십시오. `exec`가 재개 가능한 `waiting` 결과를 반환할 때만
`wait`를 사용하십시오.

## `exec`

`exec`는 코드 모드 셀을 시작하고 하나의 결과를 반환합니다. 입력 코드는 모델이
생성하므로 적대적인 것으로 취급해야 합니다.

입력:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

규칙:

- `code` 또는 `command` 중 하나는 비어 있지 않아야 합니다.
- `code`는 문서화된 모델 대상 필드입니다.
- `command`는 후크 정책 및 신뢰할 수 있는 재작성을 위한 exec 호환 별칭으로
  허용됩니다(일반 OpenClaw 셸 exec 도구도 `command`
  필드를 사용합니다). 둘 다 제공되면 값이 일치해야 합니다.
- `language`의 기본값은 `"javascript"`입니다. 일부 공급자가 해당 형태를 거부하므로,
  스키마에서는 `oneOf`/`anyOf` 유니온이 아닌 평면 문자열 열거형
  (`"javascript" | "typescript"`)으로 노출합니다.
- `language`가 `"typescript"`이면 OpenClaw는 평가 전에 트랜스파일합니다.
- `exec`는 `import`, `require`, 동적 가져오기 및 모듈 로더
  패턴을 거부합니다.
- `exec`는 일반 셸 `exec` 구현을 재귀적으로 노출하지 않습니다.
- 외부 코드 모드 `exec` 후크 이벤트에는 `toolKind: "code_mode_exec"`와
  `toolInputKind: "javascript" | "typescript"`(알려진 경우)가 포함되므로, 정책에서
  동일한 도구 이름을 공유하는 코드 모드 셀과 셸 방식 `exec` 호출을
  구분할 수 있습니다.

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

`exec`는 QuickJS VM이 재개 가능한 상태로 일시 중단되었으며 모델에 표시되는 후속 처리가 여전히 필요한 경우 `waiting`을 반환합니다. 결과에는 `wait`에서 사용할 `runId`가 포함됩니다. MCP 네임스페이스 호출을 포함한 네임스페이스 브리지 호출은 준비되는 동안 동일한 `exec`/`wait` 호출 내부에서 자동으로 모두 처리되므로, 간결한 코드 블록에서 네임스페이스의 각 await마다 모델 도구 호출을 강제하지 않고 MCP 도구를 호출할 수 있습니다.

`exec`는 게스트 VM에 보류 중인 작업이 없고 OpenClaw의 출력 어댑터가 실행된 후 최종 값이 JSON과 호환되는 경우에만 `completed`를 반환합니다.

## `wait`

`wait`는 일시 중단된 코드 모드 VM을 계속 실행합니다.

입력:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

출력은 `exec`가 반환하는 것과 동일한 `CodeModeResult` 유니온입니다.

중첩된 OpenClaw 도구는 느리거나, 대화형이거나, 승인으로 제한되거나, 부분 업데이트를 스트리밍할 수 있습니다. `wait`가 존재하므로 호스트가 외부 작업을 기다리는 동안 모델이 하나의 긴 `exec` 호출을 계속 열어 둘 필요가 없습니다.

QuickJS-WASI 스냅샷/복원이 재개 메커니즘입니다.

1. `exec`는 완료, 실패 또는 일시 중단될 때까지 코드를 평가합니다.
2. 일시 중단되면 OpenClaw는 QuickJS VM의 스냅샷을 만들고 보류 중인 호스트 작업을 기록합니다.
3. 보류 중인 작업이 완료되면 `wait`는 VM 스냅샷을 복원하고 안정적인 이름으로 호스트 콜백을 다시 등록합니다.
4. OpenClaw는 중첩 도구 결과를 복원된 VM에 전달하고 QuickJS의 보류 중인 작업을 모두 처리합니다.
5. `wait`는 `completed`, `failed` 또는 또 다른 `waiting` 결과를 반환합니다.

스냅샷은 사용자 아티팩트가 아니라 런타임 상태입니다. 스냅샷은 프로세스 내 맵에만 존재하며(데이터베이스 또는 디스크에 쓰지 않음), 크기가 제한되고, 만료되며, 스냅샷을 생성한 실행 및 세션으로 범위가 제한됩니다.

다음과 같은 경우 `wait`는 `failed` 결과로 실패합니다.

- `runId`를 알 수 없거나 해당 스냅샷이 이미 만료되었습니다.
- 호출자가 일시 중단된 실행과 동일한 실행/세션 범위에 있지 않습니다.
- 해당 `runId`에 대해 `wait`가 이미 진행 중입니다.
- QuickJS-WASI 복원에 실패합니다.
- 재개 시 `maxOutputBytes` 또는 `maxSnapshotBytes`를 초과합니다.

## 게스트 런타임 API

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS`는 실행 범위 카탈로그의 간결한 메타데이터이며, 기본적으로 전체 스키마를 포함하지 않습니다.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "mcp" | "client";
  sourceName?: string;
};
```

Plugin 도구는 소유 Plugin ID를 `sourceName`으로 설정한 `source: "openclaw"`를 사용하며, 별도의 `"plugin"` 소스 값은 없습니다. `source: "mcp"`는 `sourceName`/`mcp` 메타데이터의 MCP 항목에만 사용되며 (`ALL_TOOLS`/`tools.*`에서는 제외됨, 아래 참조), 다른 곳에서는 사용되지 않습니다.

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

// 숨겨진 카탈로그에 모호하지 않은 `web_search` 항목이 있는 경우:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

MCP 카탈로그 항목은 코드 모드에서 `tools.call(...)` 또는 편의 함수를 통해 호출할 수 없으며, 생성된 `MCP` 네임스페이스를 통해서만 노출됩니다. 읽기 전용 `API` 가상 파일 표면을 통해 TypeScript 스타일 선언 파일을 사용할 수 있으므로, 에이전트는 프롬프트에 MCP 스키마를 추가하지 않고도 MCP 시그니처를 검사할 수 있습니다.

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

`API.read("mcp/<server>.d.ts")`는 MCP 도구 메타데이터에서 추론한 간결한 선언을 반환합니다.

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** 이 TypeScript 스타일 API 헤더를 반환합니다. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * GitHub 이슈를 생성합니다.
   * @param owner 저장소 소유자
   * @param repo 저장소 이름
   * @param title 이슈 제목
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

선언 파일은 가상 파일이며 워크스페이스 또는 상태 디렉터리 아래에 기록되지 않습니다. 각 코드 모드 `exec` 호출에서 OpenClaw는 실행 범위 도구 카탈로그를 빌드하고, 표시 가능한 MCP 항목을 유지하며, 표시 가능한 서버마다 `mcp/index.d.ts`와 하나의 `mcp/<server>.d.ts`를 렌더링한 다음, 이 작은 읽기 전용 테이블을 QuickJS 워커에 주입합니다. 게스트 코드는 `API` 객체만 볼 수 있습니다. `API.list(prefix?)`는 파일 메타데이터를 반환하고 `API.read(path)`는 선택한 선언 내용을 반환합니다. 알 수 없는 경로와 `.`/`..` 세그먼트는 거부됩니다.

이렇게 하면 큰 MCP 스키마가 모델 프롬프트에 포함되지 않습니다. 에이전트는 `exec` 도구 설명에서 가상 API가 존재함을 파악하고, 필요한 선언 파일만 읽은 다음, 하나의 객체 인수로 `MCP.<server>.<tool>()`을 호출합니다. 프로그램 내부에서 단일 도구 스키마 응답을 얻기 위한 인라인 대체 수단으로 `MCP.<server>.$api()`도 계속 사용할 수 있습니다.

게스트 런타임은 호스트 객체를 직접 보지 않습니다. 입력과 출력은 명시적인 크기 제한이 적용된 JSON 호환 값으로 브리지를 통과합니다.

## 내부 네임스페이스

내부 네임스페이스는 모델에 표시되는 도구를 더 추가하지 않고 코드 모드에 간결한 도메인 API를 제공합니다. 로더 소유 통합이 `Issues` 또는 `Calendar`와 같은 네임스페이스를 등록하면, 모델에는 계속 간결한 제어/직접 표면만 표시되는 동안 게스트 코드는 QuickJS 프로그램 내에서 해당 네임스페이스를 호출합니다.

현재 네임스페이스는 내부 전용입니다. 공개 Plugin SDK 네임스페이스 API는 없습니다. 외부 Plugin 네임스페이스에는 Plugin ID, 설치된 매니페스트, 인증 상태 및 캐시된 카탈로그 설명자가 네임스페이스를 지원하는 Plugin 도구와 달라지지 않도록 로더 소유 계약이 필요합니다. 코어 코드 모드는 샌드박스, 직렬화, 카탈로그 게이팅 및 브리지 디스패치만 소유합니다.

게스트 코드는 직접 전역 객체 또는 `namespaces` 맵 중 하나를 사용할 수 있습니다.

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### 레지스트리 수명 주기

네임스페이스 레지스트리는 프로세스 로컬이며 네임스페이스 ID를 키로 사용합니다.

1. 신뢰할 수 있는 로더가 `registerCodeModeNamespaceForPlugin(pluginId, registration)`을 호출합니다.
2. 코드 모드는 실행을 위한 숨겨진 `ToolSearchRuntime`을 생성하고 실행 범위 카탈로그를 읽습니다.
3. `createCodeModeNamespaceRuntime(ctx, catalog)`은 모든 `requiredToolNames`가 표시 가능하고 동일한 `pluginId`가 소유한 등록만 유지합니다.
4. 표시 가능한 각 네임스페이스는 현재 실행에 대해 `createScope(ctx)`를 호출하여 `agentId`, `sessionKey`, `sessionId`, `runId`, 구성 및 중단 상태와 같은 실행 컨텍스트를 받습니다.
5. 범위 데이터는 일반 설명자로 직렬화되고 직접 전역 객체 및 `namespaces.<globalName>`으로 QuickJS에 주입됩니다.
6. 게스트 호출은 워커 브리지를 통해 일시 중단되고, 호스트에서 네임스페이스 경로를 해석하며, 호출을 선언된 Plugin 소유 카탈로그 도구에 매핑하고, `ToolSearchRuntime.callExactId`를 통해 해당 도구를 실행합니다.
7. 준비된 네임스페이스 브리지 호출은 활성 `exec`/`wait` 호출 내에서 자동으로 모두 처리됩니다. 제한 시간에 네임스페이스 작업이 아직 보류 중이거나 게스트가 명시적으로 양보하면, 나중에 `wait`가 동일한 네임스페이스 런타임을 재개합니다.
8. Plugin 롤백 또는 제거 시 `clearCodeModeNamespacesForPlugin(pluginId)`을 호출하여 오래된 전역 객체가 실패한 Plugin 로드 후에도 남지 않도록 합니다.

네임스페이스 호출은 카탈로그 도구 호출입니다. `tools.call(...)`과 동일한 정책 훅, 승인, 중단 처리, 텔레메트리, 트랜스크립트 투영 및 일시 중단/재개 동작을 사용합니다.

### 등록 형식

지원 도구를 소유한 통합에서 네임스페이스를 등록하십시오. 범위를 작게 유지하고 선언된 카탈로그 도구에 매핑되는 도메인 동사만 노출하십시오.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "현재 저장소를 위한 GitHub 이슈 헬퍼입니다.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Issues.list(params) 및 Issues.update(number, patch)를 사용하십시오.",
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

`createCodeModeNamespaceTool(toolName, inputMapper)`는 범위 멤버를 호출 가능한 네임스페이스 함수로 표시합니다. 선택적 `inputMapper`는 게스트 인수를 받아 지원 카탈로그 도구의 입력 객체를 반환합니다. 지정하지 않으면 첫 번째 게스트 인수를 사용하며, 인수가 생략된 경우 `{}`를 사용합니다.

게스트 코드가 실행되기 전에 원시 호스트 함수가 거부됩니다.

```typescript
createScope: () => ({
  // 잘못된 방식: 카탈로그 도구 수명 주기를 우회하므로 거부됩니다.
  list: async () => githubClient.listIssues(),
});
```

### 소유권 및 가시성

네임스페이스 소유권은 등록 호출자의 `pluginId`에 바인딩됩니다. `requiredToolNames`는 가시성 게이트이면서 소유권 검사입니다.

- 모든 필수 도구가 실행 카탈로그에 존재해야 합니다.
- 모든 필수 도구의 `sourceName === pluginId`여야 합니다.
- 필수 도구가 없거나 다른 Plugin이 소유한 경우 네임스페이스가 숨겨집니다.
- 호출 가능한 각 경로는 `requiredToolNames`에 명시된 도구만 대상으로 지정할 수 있습니다.

이렇게 하면 다른 Plugin이 같은 이름의 도구를 등록하여 네임스페이스를 노출하는 것을 방지하고 네임스페이스를 일반 에이전트 정책과 일치시킵니다. 실행에서 지원 도구를 볼 수 없으면 네임스페이스도 볼 수 없습니다.

예를 들어 GitHub 네임스페이스는 GitHub 인증, REST/GraphQL 클라이언트, 속도 제한, 쓰기 승인 및 테스트를 소유하는 GitHub 소유 Plugin 뒤에 있어야 합니다. 코어 코드 모드는 GitHub 전용 API, 토큰 처리 또는 제공자 정책을 포함해서는 안 됩니다.

### 범위 직렬화 규칙

`createScope(ctx)`는 JSON 호환 값, 배열, 중첩 객체 및 `createCodeModeNamespaceTool(...)` 호출 마커가 포함된 일반 객체를 반환할 수 있습니다. 호스트 객체는 QuickJS에 직접 들어가지 않습니다.

직렬화기는 다음을 거부합니다.

- 원시 함수
- 순환 객체 그래프
- 안전하지 않은 경로 세그먼트: `__proto__`, `constructor`, `prototype`, 빈 키
  또는 내부 경로 구분자를 포함하는 키
- JavaScript 식별자가 아닌 `globalName` 값
- `tools`, `namespaces`, `text`, `json`, `yield_control`, `MCP`, `API`, `ALL_TOOLS`
  또는 `__openclaw*`와 같은 기본 제공 코드 모드 전역 항목과 충돌하는 `globalName`

JSON으로 직렬화할 수 없는 값은 브리지를 통과하기 전에 JSON에 안전한 대체
값으로 변환됩니다. 바이너리 데이터, 핸들, 소켓, 클라이언트 및 클래스
인스턴스는 일반 카탈로그 도구 뒤에 유지해야 합니다.

### 프롬프트

네임스페이스 `description`과 선택적 `prompt`는 해당 실행에서 네임스페이스가
표시되는 경우에만 모델에 표시되는 `exec` 스키마에 추가됩니다. 가장 작으면서
유용한 표면을 알려주는 데 사용하십시오.

```typescript
{
  description: "소설 제작 서비스 도우미입니다.",
  prompt:
    "Fictions.riskAudit(), Fictions.promoteIfReady(id, status), Fictions.unpaidOver(amount)를 사용하십시오.",
}
```

프롬프트는 인증 설정, 구현 이력 또는 관련 없는 Plugin 동작이 아니라
네임스페이스 계약에 관한 내용으로 유지하십시오.

### 정리

네임스페이스는 프로세스 로컬 등록입니다. 소유 Plugin이 비활성화되거나,
제거되거나, 롤백될 때 제거하십시오.

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

코드 모드 정리는 Plugin이 소유합니다. 네임스페이스별 해제 핸들을 유지하는
대신 수명 주기가 끝날 때 Plugin의 네임스페이스 등록을 정리하십시오.
테스트에서는 사례 간 등록 누수를 방지하기 위해
`clearCodeModeNamespacesForTest()`를 호출할 수 있습니다.

### 테스트 체크리스트

네임스페이스 변경은 보안 경계와 게스트 동작을 다뤄야 합니다.

- 네임스페이스 프롬프트 텍스트는 기반 도구가 표시될 때만 나타납니다
- 다른 `sourceName`의 동일한 이름을 가진 도구는 네임스페이스를 노출하지 않습니다
- 원시 범위 함수는 거부됩니다
- 위조된 네임스페이스 ID와 위조된 경로는 거부됩니다
- 호출 가능한 경로는 선언되지 않은 도구를 대상으로 지정할 수 없습니다
- 중첩 객체와 공유 참조가 올바르게 직렬화됩니다
- 네임스페이스 호출은 카탈로그 도구를 통해 실행되고 JSON에 안전한 세부 정보를 반환합니다
- 게스트 코드가 실패를 포착할 수 있습니다
- 일시 중단된 네임스페이스 호출은 `wait`를 통해 재개됩니다
- Plugin 롤백 시 소유 네임스페이스 등록이 정리됩니다

네임스페이스는 일반 `tools.search`/`tools.call` 카탈로그를 보완합니다. 임의로
활성화된 OpenClaw, Plugin 및 클라이언트 도구에는 카탈로그를 사용하고, MCP
도구에는 `MCP`를 사용하며, 간결한 코드가 반복적인 스키마 조회보다 안정적인
Plugin 소유의 문서화된 도메인 API에는 다른 네임스페이스를 사용하십시오.

## 출력 API

- `text(value)`는 사람이 읽을 수 있는 출력을 `output` 배열에 추가합니다.
- `json(value)`은 JSON 호환 직렬화 후 구조화된 출력 항목을 추가합니다.
- 게스트 코드가 마지막으로 반환한 값은 `completed` 결과의 `value`가 됩니다.

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

규칙: 출력 순서는 게스트 호출 순서와 일치하고, 출력은 `maxOutputBytes`로
제한되며, 직렬화할 수 없는 값은 일반 문자열이나 오류로 변환되고, 바이너리
값은 지원되지 않습니다. 이미지와 파일은 코드 모드 브리지가 아니라 일반
OpenClaw 도구를 통해 전달됩니다.

## 도구 카탈로그

숨겨진 카탈로그에는 유효 정책 필터링 이후의 도구가 다음 순서로 포함됩니다.
OpenClaw 코어 도구, 번들 Plugin 도구, 외부 Plugin 도구, MCP 도구, 그리고
현재 실행을 위해 클라이언트가 제공한 도구입니다.

카탈로그 ID는 한 실행 내에서 안정적이며, 가능한 경우 동등한 도구 집합 간에
결정적입니다. 실제 형식은 다음과 같습니다.

```text
<source>:<owner>:<tool-name>
```

여기서 `<source>`는 `openclaw`, `mcp` 또는 `client`입니다(Plugin 도구는
Plugin ID를 `<owner>`로 하여 `openclaw`를 사용하고, 코어 도구는
`openclaw:core:*`를 사용합니다). 예:

```text
openclaw:core:message
openclaw:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

카탈로그에서는 코드 모드 제어 도구(`exec`, `wait`, `tool_search_code`,
`tool_search`, `tool_describe`, `tool_call`)와 직접 전용 도구를 제외합니다.
제어 도구는 카탈로그를 통해 재귀 호출되어서는 안 됩니다. 직접 전용 도구는
구조화된 결과가 QuickJS 브리지를 통과할 수 없으므로 모델에 계속 표시됩니다.

MCP 항목은 정책, 승인, 훅, 텔레메트리, 트랜스크립트 투영 및 정확한 도구 ID가
일반 도구 실행과 공유되도록 실행 범위 카탈로그에 유지됩니다. 게스트에 표시되는
`ALL_TOOLS`, `tools.search(...)`, `tools.describe(...)`, `tools.call(...)`
보기에서는 MCP 항목을 제외합니다. 생성된 `MCP.<server>.<tool>({ ...input })`
네임스페이스는 정확한 카탈로그 ID로 다시 확인되고 동일한 실행기 경로를 통해
디스패치됩니다.

## 도구 검색 상호 작용

코드 모드가 활성화된 실행에서는 코드 모드가 OpenClaw 도구 검색 모델 표면을
대체합니다.

`tools.codeMode.enabled`가 true이고 코드 모드가 활성화되면:

- OpenClaw는 `tool_search_code`, `tool_search`, `tool_describe` 또는
  `tool_call`을 모델에 표시되는 도구로 노출하지 않습니다.
- 동일한 카탈로그화 개념이 게스트 런타임 내부로 이동합니다.
- 게스트 런타임은 MCP가 아닌 도구에 대한 간결한 `ALL_TOOLS` 메타데이터와
  검색/설명/호출 도우미를 받습니다.
- MCP 호출은 `tools.call(...)` 대신 생성된 `MCP` 네임스페이스와 해당
  `$api()` 헤더를 사용합니다.
- 중첩 호출은 도구 검색이 사용하는 것과 동일한 OpenClaw 실행기 경로를 통해
  디스패치됩니다.

활성 실행에서 코드 모드가 대체하는 OpenClaw 간결 카탈로그 브리지에 대해서는
[도구 검색](/ko/tools/tool-search)을 참조하십시오.

## 도구 이름과 충돌

모델에 표시되는 `exec` 도구는 코드 모드 도구입니다. 일반 OpenClaw 셸
`exec` 도구가 활성화되어 있으면 모델에서는 숨겨지고 다른 도구와 동일하게
카탈로그에 등록됩니다.

게스트 런타임 내부에서는:

- 정책에서 허용하는 경우 `tools.call("openclaw:core:exec", input)`로 셸
  exec 도구를 호출할 수 있습니다.
- `tools.exec(...)`는 셸 exec 카탈로그 항목에 모호하지 않은 안전한 이름이
  있는 경우에만 설치됩니다.
- 코드 모드 `exec` 도구는 `tools`를 통해 재귀적으로 사용할 수 없습니다.

두 도구가 동일한 안전한 편의 이름으로 정규화되면 OpenClaw는 편의 함수를
생략하고 `tools.call(id, input)`을 요구합니다.

## 중첩 도구 실행

모든 중첩 도구 호출은 호스트 브리지를 통과하고 OpenClaw에 다시 진입하며,
활성 에이전트 ID, 세션 ID와 키, 발신자와 채널 컨텍스트, 샌드박스 정책,
승인 정책, Plugin `before_tool_call` 훅, 중단 신호, 사용 가능한 경우
스트리밍 업데이트, 궤적/감사 이벤트를 보존합니다.

중첩 호출은 실제 도구 호출로 트랜스크립트에 투영되므로 지원 번들에서 발생한
작업을 확인할 수 있으며, 해당 투영은 상위 코드 모드 도구 호출과 중첩 도구
ID를 식별합니다.

병렬 중첩 호출은 `maxPendingToolCalls`까지 허용됩니다.

## 실행 및 스냅샷 수명 주기

각 코드 모드 실행은 `runId`를 키로 하는 프로세스 내 맵에서 추적됩니다
(디스크나 데이터베이스에는 영구 저장되지 않음). `exec`/`wait`는 세 가지
결과 상태 중 하나인 `completed`, `waiting` 또는 `failed`를 반환합니다.

- `waiting` 결과는 `wait`가 재개하거나 만료될 때까지 QuickJS 스냅샷, 대기
  중인 브리지 요청 및 범위 메타데이터(에이전트 실행 ID, 세션 ID/키)를
  저장합니다.
- 만료, 잘못된 세션, 잘못된 실행 및 알 수 없거나 이미 재개 중인 `runId`
  값은 별도의 종료 상태를 생성하지 않습니다. 대신 `code mode
run is unavailable or expired.` 또는 `code mode run belongs to a different
session.`과 같은 메시지를 포함하는 `failed` 결과(`code: "invalid_input"`)로
  나타납니다.
- 실행의 스냅샷은 `completed` 또는 `failed`로 확정되는 즉시 맵에서
  제거되거나 Gateway 종료 시 폐기됩니다(재시작 후에는 아무것도 유지되지
  않으며, 이는 일시적인 런타임 상태입니다).
- 읽기 전용 작업의 경우 `exec`에서 `restartSafe: true`를 설정할 수 있습니다.
  그러면 OpenClaw는 부작용이 있는 카탈로그 호출과 Plugin 네임스페이스를 실행
  전에 거부하고 일시 중단된 결과를 재생 안전으로 표시합니다. 재시작으로
  `wait`가 중단되면 [재시작 복구](/gateway/restart-recovery)는 프로세스 로컬
  스냅샷을 복원하는 대신 트랜스크립트에서 턴을 재구성합니다. 복구 턴 자체는
  감사된 읽기 전용 코어 도구와 명시적으로 재생 안전한 Plugin 도구로 계속
  제한됩니다.
- OpenClaw는 프로세스당 동시에 일시 중단되는 실행 수를 64개로 제한하며,
  이 한도를 초과하는 새 일시 중단을 `too many suspended code mode
runs.` 메시지와 함께 거부합니다.

스냅샷 저장 공간은 실행당 `maxSnapshotBytes`, 위의 프로세스당 일시 중단 실행
한도 및 `snapshotTtlSeconds`로 제한됩니다.

## QuickJS-WASI 런타임

OpenClaw는 소유 패키지에서 `quickjs-wasi`를 직접 종속성으로 로드하며, 관련
없는 종속성을 위해 설치된 전이적 사본에 의존하지 않습니다.

런타임의 책임: QuickJS-WASI WebAssembly 모듈 컴파일/로드, 코드 모드 실행
또는 재개마다 격리된 VM 하나 생성, 안정적인 이름으로 호스트 콜백 등록,
메모리 및 인터럽트 제한 설정, JavaScript 평가, 대기 중인 작업 처리,
일시 중단된 VM 상태 스냅샷 생성, `wait`용 스냅샷 복원, 종료 상태 이후 VM
핸들과 스냅샷 폐기입니다.

런타임은 OpenClaw의 메인 이벤트 루프 외부에 있는 Node.js 워커 스레드에서
실행됩니다. 게스트의 무한 루프가 Gateway 프로세스를 무기한 차단해서는 안
됩니다. 워커의 인터럽트 핸들러는 게스트 코드의 협조 여부와 관계없이
벽시계 시간 제한을 적용합니다.

## TypeScript

TypeScript 지원은 소스 변환만 수행합니다. 허용되는 입력은 하나의 TypeScript
코드 문자열이며, 출력은 QuickJS-WASI에서 평가되는 JavaScript 문자열입니다.
타입 검사는 없고, 모듈 해석도 없으며, `import`/`require`도 없습니다. 진단은
`failed` 결과로 반환됩니다.

TypeScript 컴파일러는 TypeScript 셀에서만 지연 로드됩니다. 일반 JavaScript
셀과 비활성화된 코드 모드에서는 로드되지 않습니다.

## 보안 경계

모델 코드는 적대적입니다. 런타임은 심층 방어를 사용합니다.

- 메인 이벤트 루프 외부의 워커 스레드에서 QuickJS-WASI를 실행합니다
- Codex 또는 전이적 패키지를 통하지 않고 `quickjs-wasi`를 직접 종속성으로
  로드합니다
- 게스트에는 파일 시스템, 네트워크, 하위 프로세스, 모듈 가져오기, 환경 변수
  또는 호스트 전역 객체가 없습니다
- QuickJS 메모리 및 인터럽트 제한과 상위 프로세스의 벽시계 시간 제한을
  사용합니다
- 출력, 스냅샷, 로그 및 대기 중 호출 한도를 적용합니다
- 좁은 JSON 어댑터를 통해 호스트 브리지 값을 직렬화합니다
- 호스트 오류를 일반 게스트 오류로 변환하며, 호스트 렐름 객체는 절대
  전달하지 않습니다
- 시간 초과, 중단, 세션 종료 또는 만료 시 스냅샷을 폐기합니다
- `exec`, `wait` 및 도구 검색 제어 도구에 대한 재귀적 접근을 거부합니다
- 편의 이름 충돌이 카탈로그 도우미를 가리지 못하도록 방지합니다

샌드박스는 하나의 보안 계층일 뿐이며, 고위험 배포에서는 운영자가 OS 수준의
강화 조치를 추가로 적용해야 할 수 있습니다.

## 오류 코드

```typescript
type CodeModeErrorCode =
  | "invalid_input"
  | "runtime_unavailable"
  | "timeout"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "internal_error";
```

`invalid_input`은 잘못된 `exec`/`wait` 인수, 비활성화된 언어, 거부된 모듈
접근, TypeScript 변환 실패, 알 수 없거나 만료되었거나 범위가 잘못된 `runId`
값 및 너무 많은 일시 중단 실행을 포함합니다. `runtime_unavailable`은
QuickJS 워커가 시작되지 않거나 0이 아닌 코드로 종료되는 경우를 포함합니다.

게스트에 반환되는 오류는 일반 데이터입니다. 호스트 `Error` 인스턴스, 스택
객체, 프로토타입 및 호스트 함수는 QuickJS로 전달되지 않습니다.

## 텔레메트리

각 결과의 `telemetry` 필드는 숨겨진 카탈로그 크기와 소스별 분석
(`openclaw`/`mcp`/`client` 개수), 실행 카탈로그의 누적 검색/설명/호출 횟수,
그리고 모델에 표시되는 도구 이름(`exec`, `wait` 및 유지된 직접 전용 도구)을
보고합니다.

텔레메트리에는 기존 OpenClaw 궤적 정책에서 허용하는 범위를 넘어서는 비밀,
원시 환경 값 또는 수정되지 않은 도구 입력이 포함되어서는 안 됩니다.

## 디버깅

코드 모드가 일반 도구 실행과 다르게 동작할 때는 대상이 지정된 모델 전송
로깅을 사용하십시오.

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

페이로드 형식 디버깅에는 `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`를
사용하십시오. 이는 모델 요청의 크기가 제한되고 수정된 JSON 스냅샷을
기록합니다. 프롬프트와 메시지 텍스트가 여전히 나타날 수 있으므로 디버깅
중에만 사용하십시오.

스트림 디버깅에는 `OPENCLAW_DEBUG_SSE=peek`을 사용하여 마스킹된 처음 5개의
SSE 이벤트를 기록하십시오. 또한 코드 모드 표면이 활성화된 후 최종 제공자
페이로드에 정확히 하나의 `exec`, 하나의 `wait`, 그리고 승인된
직접 전용 도구만 포함되지 않으면 코드 모드는 실패 시 닫힙니다.

## 구현 구성

- 구성 계약: `tools.codeMode`
- 카탈로그 빌더: 유효 도구를 간결한 항목과 ID 맵으로 변환
- 모델 표면 어댑터: 표시되는 도구를 제어/직접 도구로 교체
- QuickJS-WASI 런타임 어댑터: 로드, 평가, 스냅샷, 복원, 폐기
- 워커 감독자: 시간 초과, 중단, 충돌 격리
- 브리지 어댑터: JSON 안전 호스트 콜백 및 결과 전달
- TypeScript 변환 어댑터
- 스냅샷 저장소: TTL, 크기 상한, 실행/세션 범위 지정
- 중첩 도구 호출의 궤적 프로젝션
- 텔레메트리 카운터 및 진단

구현은 Tool Search의 카탈로그 및 실행기 개념을 재사용하지만,
샌드박스로 `node:vm` 자식을 사용하지 않습니다.

## 검증 체크리스트

코드 모드 적용 범위는 다음을 입증해야 합니다.

- 비활성화된 구성에서는 기존 도구 노출이 변경되지 않음
- `enabled: true`가 없는 객체 구성에서는 코드 모드가 비활성화된 상태로 유지됨
- 활성화된 구성에서는 실행에 도구가 활성화된 경우 모델에 `exec`, `wait` 및
  필수 직접 전용 도구만 노출됨
- 도구가 없는 원시 실행, `disableTools`, 빈 허용 목록에서는
  코드 모드 페이로드 강제가 트리거되지 않음
- 카탈로그에 포함할 수 있는 모든 유효 비 MCP 도구가 `ALL_TOOLS`에 표시됨
- 직접 전용 도구는 모델에 계속 표시되며 `ALL_TOOLS`에는 표시되지 않음
- 거부된 도구는 `ALL_TOOLS`에 표시되지 않음
- `tools.search`, `tools.describe`, `tools.call`이 OpenClaw 도구에서 작동함
- `API.list("mcp")`와 `API.read("mcp/<server>.d.ts")`가 브리지/도구 호출 없이
  TypeScript 형식의 MCP 선언을 노출함
- MCP 네임스페이스 `$api()`가 스키마를 위한 인라인 폴백으로 계속 사용 가능함
- MCP 네임스페이스 호출은 하나의 객체 입력을 받는 표시 가능한 MCP 도구에서
  작동하며, 직접 MCP 카탈로그 항목은 `tools.*`에 없음
- Tool Search 제어 도구가 모델 표면과 숨겨진 카탈로그 모두에서 숨겨짐
- 중첩 호출에서 승인 및 훅 동작이 보존됨
- 셸 `exec`는 모델에서 숨겨지지만 허용된 경우 카탈로그 ID로 호출할 수 있음
- 재귀적인 코드 모드 `exec`와 `wait`는 게스트 코드에서 호출할 수 없음
- 비활성화되었거나 JavaScript 전용인 경로에서 TypeScript를 로드하지 않고
  TypeScript 입력이 변환 및 평가됨
- `import`, `require`, 파일 시스템, 네트워크 및 환경 액세스가 실패함
- 무한 루프는 시간 초과되며 Gateway를 차단할 수 없음
- 메모리 상한 실패 시 게스트 VM이 종료됨
- 완료된 호출과 일시 중단된 호출 모두에 출력 및 스냅샷 상한이 적용됨
- `wait`가 일시 중단된 스냅샷을 재개하고 최종 값을 반환함
- 만료되거나 중단되었거나 세션이 잘못되었거나 알 수 없는 `runId` 값은 실패함
- 트랜스크립트 재생 및 지속성에서 코드 모드 제어 호출이 보존됨
- 트랜스크립트와 텔레메트리에 중첩 도구 호출이 명확하게 표시됨

## E2E 테스트 계획

런타임을 변경할 때 다음을 통합 또는 엔드투엔드 테스트로 실행하십시오.

1. `tools.codeMode.enabled: false`로 Gateway를 시작합니다.
2. 작은 직접 도구 집합으로 에이전트 턴을 전송합니다.
3. 모델에 표시되는 도구가 변경되지 않았는지 확인합니다.
4. `tools.codeMode.enabled: true`로 다시 시작합니다.
5. OpenClaw, Plugin, MCP 및 클라이언트 테스트 도구를 사용하여 에이전트 턴을 전송합니다.
6. 모델에 표시되는 도구 목록이 `exec`, `wait` 및 구성된
   직접 전용 도구만으로 이루어졌는지 확인합니다.
7. `exec`에서 `ALL_TOOLS`를 읽고 카탈로그에 포함할 수 있는 유효 테스트
   도구가 존재하며 직접 전용 도구는 없는지 확인합니다.
8. `exec`에서 `tools.search`, `tools.describe`, `tools.call`을 통해
   OpenClaw/Plugin/클라이언트 도구를 호출합니다.
9. `exec`에서 `API.list("mcp")`와 `API.read("mcp/<server>.d.ts")`를 호출하고
   선언 파일이 표시 가능한 MCP 도구를 설명하는지 확인합니다.
10. `exec`에서 `MCP.<server>.<tool>({ ...input })`을 통해 MCP 도구를 호출하고
    직접 MCP 카탈로그 항목이 `ALL_TOOLS`와 `tools.*`에 없는지
    확인합니다.
11. 거부된 도구가 없으며 추측한 ID로 호출할 수 없는지 확인합니다.
12. `exec`가 `waiting`을 반환한 후 완료되는 중첩 도구 호출을 시작합니다.
13. `wait`를 호출하고 복원된 VM이 도구 결과를 받는지 확인합니다.
14. 최종 답변에 복원 후 생성된 출력이 포함되는지 확인합니다.
15. 시간 초과, 중단 및 스냅샷 만료 시 런타임 상태가 정리되는지 확인합니다.
16. 궤적을 내보내고 중첩 호출이 상위 코드 모드 호출 아래에 표시되는지
    확인합니다.

이 페이지의 문서만 변경한 경우에도 `pnpm check:docs`를 실행해야 합니다.

## 관련 항목

- [Tool Search](/ko/tools/tool-search)
- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [Exec 도구](/ko/tools/exec)
- [코드 실행](/ko/tools/code-execution)
