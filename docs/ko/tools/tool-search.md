---
read_when:
    - 모든 도구 스키마를 프롬프트에 추가하지 않고도 OpenClaw 에이전트가 대규모 도구 카탈로그를 사용하도록 하려는 경우
    - OpenClaw 도구, MCP 도구, 클라이언트 도구를 하나의 간결한 런타임 표면을 통해 노출하려는 경우
    - OpenClaw 실행을 위한 도구 검색을 구현하거나 디버깅하고 있습니다
summary: '도구 검색: 대규모 OpenClaw 도구 카탈로그를 검색, 설명, 호출 뒤에 숨겨 간소화'
title: 도구 검색
x-i18n:
    generated_at: "2026-06-30T13:55:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81036277d763be8040526b42c116b2e503589921a58b3f765ff38670554a751c
    source_path: tools/tool-search.md
    workflow: 16
---

도구 검색은 실험적인 OpenClaw 에이전트 런타임 기능입니다. 에이전트가 대규모 도구 카탈로그를 탐색하고 호출할 수 있는
간결한 단일 방식을 제공합니다. 실행에 사용 가능한 도구가 많지만 모델이 그중 몇 개만 필요로 할 가능성이 클 때 유용합니다.

이 페이지는 OpenClaw 도구 검색을 문서화합니다. 이는 Codex 네이티브 도구
검색 또는 동적 도구 표면이 아닙니다. Codex 네이티브 코드 모드, 도구 검색, 지연된
동적 도구, 중첩 도구 호출은 안정적인 Codex 하네스 표면이며
`tools.toolSearch`에 의존하지 않습니다.

OpenClaw 실행에 활성화하면 모델은 기본적으로 하나의 `tool_search_code` 도구를
받습니다. 이 도구는 격리된 Node 하위 프로세스에서 `openclaw.tools` 브리지를 통해
짧은 JavaScript 본문을 실행합니다.

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

카탈로그에는 OpenClaw 도구, Plugin 도구, MCP 도구, 그리고
클라이언트 제공 도구가 포함될 수 있습니다. 모델은 모든 전체 스키마를 처음부터 보지 않습니다.
대신 간결한 설명자를 검색하고, 정확한 스키마가 필요할 때 선택한 도구 하나를 설명한 뒤,
OpenClaw를 통해 해당 도구를 호출합니다.

Codex 하네스 실행은 이러한 실험적인 OpenClaw 도구 검색
제어를 받지 않습니다. OpenClaw는 제품 기능을 동적 도구로 Codex에 전달하며,
Codex는 안정적인 네이티브 코드 모드, 네이티브 도구 검색, 지연된 동적
도구, 중첩 도구 호출을 소유합니다.

## 턴 실행 방식

계획 시점에 OpenClaw 내장 러너는 해당 실행의 유효 카탈로그를 빌드합니다.

1. 에이전트, 프로필, 샌드박스, 세션의 활성 도구 정책을 확인합니다.
2. 사용 가능한 OpenClaw 및 Plugin 도구를 나열합니다.
3. 세션 MCP 런타임을 통해 사용 가능한 MCP 도구를 나열합니다.
4. 현재 실행에 제공된 사용 가능한 클라이언트 도구를 추가합니다.
5. 검색용 간결한 설명자를 인덱싱합니다.
6. OpenClaw 코드 브리지, 구조화된 대체 도구, 또는
   간결한 디렉터리 표면을 모델에 노출합니다.

실행 시점에는 모든 실제 도구 호출이 OpenClaw로 돌아옵니다. 격리된 Node
런타임은 Plugin 구현, MCP 클라이언트 객체, 또는 시크릿을 보유하지 않습니다.
`openclaw.tools.call(...)`은 브리지를 건너 Gateway로 다시 들어가며, 여기서
일반 정책, 승인, 훅, 로깅, 결과 처리가 그대로 적용됩니다.

## 모드

`tools.toolSearch`에는 모델에 노출되는 세 가지 모드가 있습니다.

- `code`: 기본 간결한 JavaScript 브리지인 `tool_search_code`를 노출합니다.
- `tools`: 코드를 받아서는 안 되는 공급자를 위해 `tool_search`, `tool_describe`, `tool_call`을 일반
  구조화된 도구로 노출합니다.
- `directory`: 모든 전체 스키마 없이 도구 이름을 봐야 하는
  공급자를 위해 사용 가능한 도구 이름과 설명의 제한된 프롬프트 디렉터리와 함께
  `tool_search`, `tool_describe`, `tool_call`을 노출합니다. OpenClaw는
  현재 턴에 가능성이 높거나 필요한 소규모 제한된 도구 스키마 집합도 직접 노출할 수
  있습니다.

모든 모드는 동일한 정책 필터링 카탈로그와 일반 OpenClaw 실행
경로를 사용합니다. 현재 런타임이 격리된 Node 코드 모드 하위
프로세스를 시작할 수 없으면 기본 `code` 모드는 카탈로그
Compaction 전에 `tools`로 대체됩니다. `directory` 모드에서는 클라이언트 제공 도구가
현재 실행에 직접 표시된 상태로 유지되며, OpenClaw 도구, Plugin 도구, MCP 도구는
디렉터리 카탈로그 뒤로 압축될 수 있습니다. 정확한 숨겨진
디렉터리 이름에 대한 직접 호출은 실행 전에 동일한 승인된 카탈로그에서 하이드레이션됩니다.

모든 모드는 실험적입니다. 작은 OpenClaw 도구
카탈로그에는 직접 도구 노출을 선호하고, Codex 하네스 실행에는 Codex 네이티브 안정 표면을 선호하세요.

별도의 소스 선택 설정은 없습니다. 도구 검색이 활성화되면
카탈로그에는 일반 정책 필터링 후 사용 가능한 OpenClaw, MCP, 클라이언트 도구가 포함됩니다.

## 존재 이유

대규모 카탈로그는 유용하지만 비용이 큽니다. 모든 도구 스키마를 모델에 보내면
요청이 커지고, 계획이 느려지며, 우발적인 도구
선택이 증가합니다.

도구 검색은 형태를 바꿉니다.

- 직접 도구: 모델은 첫 토큰 전에 선택된 모든 스키마를 봅니다
- 도구 검색 코드 모드: 모델은 하나의 간결한 코드 도구와 짧은 API
  계약을 봅니다
- 도구 검색 도구 모드: 모델은 세 개의 간결한 구조화된 대체
  도구를 봅니다
- 도구 검색 디렉터리 모드: 모델은 제한된 디렉터리와
  검색/설명/호출 제어, 그리고 가능성이 높거나 필요한 소규모 제한된
  스키마 집합을 봅니다
- 턴 중: 모델은 필요에 따라 남은 스키마를 로드할 수 있습니다

작은 카탈로그에는 여전히 직접 도구 노출이 올바른 기본값입니다. 도구 검색은
하나의 실행이 많은 도구, 특히 MCP 서버나
클라이언트 제공 앱 도구의 많은 도구를 볼 수 있을 때 가장 적합합니다.

## API

`openclaw.tools.search(query, options?)`

현재 실행의 유효 카탈로그를 검색합니다. 결과는 간결하며
프롬프트 컨텍스트에 다시 넣어도 안전합니다.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

정확한 입력 스키마를 포함하여 검색 결과 하나의 전체 메타데이터를 로드합니다.

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

선택한 도구를 OpenClaw를 통해 호출합니다.

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

구조화된 대체 모드는 동일한 작업을 도구로 노출합니다.

- `tool_search`
- `tool_describe`
- `tool_call`

디렉터리 모드는 다음을 노출합니다.

- `tool_search`
- `tool_describe`
- `tool_call`

또한 클라이언트 제공 도구를 직접 표시된 상태로 유지하며, 현재
턴에 가능성이 높거나 필요한 소규모 제한된 카탈로그 도구 스키마 집합을 직접 노출할 수 있습니다.
제한된 디렉터리가 항목을 생략하는 경우 `tool_search`를 사용해 찾으세요. 모델이
정확한 숨겨진 디렉터리 도구 이름을 직접 요청하면 OpenClaw는
일반 실행 전에 승인된 카탈로그에서 이를 하이드레이션합니다.
디렉터리 모드 클라이언트 도구 이름은 OpenClaw, Plugin, MCP
도구 이름과 충돌해서는 안 됩니다. 정확한 지연 디스패치가 해당 이름을 사용하기 때문입니다.

## 런타임 경계

코드 브리지는 수명이 짧은 Node 하위 프로세스에서 실행됩니다. 하위 프로세스는
Node 권한 모드가 활성화된 상태, 빈 환경, 파일 시스템 또는
네트워크 권한 없음, 하위 프로세스 또는 워커 권한 없음으로 시작됩니다. OpenClaw는
부모 프로세스 벽시계 제한 시간을 강제하고, 비동기 연속 후를 포함해
시간 초과 시 하위 프로세스를 종료합니다.

런타임은 다음만 노출합니다.

- `console.log`, `console.warn`, `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

최종 호출에는 일반 OpenClaw 동작이 그대로 적용됩니다.

- 도구 허용 및 거부 정책
- 에이전트별 및 샌드박스별 도구 제한
- 채널/런타임 도구 정책
- 승인 훅
- Plugin `before_tool_call` 훅
- 세션 ID, 로그, 텔레메트리

## 설정

기본 코드 브리지로 OpenClaw 실행에 도구 검색을 활성화합니다.

```bash
openclaw config set tools.toolSearch true
```

동등한 JSON:

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

OpenClaw 실행에 대신 구조화된 대체 도구를 사용합니다.

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

OpenClaw 실행에 대신 간결한 디렉터리 표면을 사용합니다.

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

코드 모드 제한 시간과 검색 결과 제한을 조정합니다.

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

비활성화합니다.

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## 프롬프트와 텔레메트리

도구 검색은 직접 도구 노출과 비교할 수 있도록 충분한 텔레메트리를 기록합니다.

- 하네스에 전송된 직렬화된 도구 및 프롬프트 총 바이트
- 카탈로그 크기와 소스 분포
- 검색, 설명, 호출 횟수
- OpenClaw를 통해 실행된 최종 도구 호출
- 선택된 도구 ID와 소스

세션 로그를 통해 다음 질문에 답할 수 있어야 합니다.

- 모델이 처음에 본 도구 스키마 수
- 수행한 검색 및 설명 작업 수
- 호출된 최종 도구
- 결과가 OpenClaw, MCP, 또는 클라이언트 도구에서 왔는지 여부

## E2E 검증

QA Lab Gateway 시나리오는 OpenClaw 런타임을 사용해 두 경로를 모두 증명합니다.

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

대규모 도구 카탈로그가 있는 임시 가짜 Plugin을 만들고, 모의
OpenAI 공급자를 시작하며, 직접 모드에서 한 번, 도구 검색
활성화 상태에서 한 번 Gateway를 시작한 다음, 공급자 요청 페이로드와 세션 로그를 비교합니다.

회귀 테스트는 다음을 증명합니다.

1. 직접 모드가 가짜 Plugin 도구를 호출할 수 있습니다.
2. 도구 검색이 동일한 가짜 Plugin 도구를 호출할 수 있습니다.
3. 직접 모드는 가짜 Plugin 도구 스키마를 공급자에 직접 노출합니다.
4. 도구 검색은 간결한 브리지만 노출합니다.
5. 대규모 가짜 카탈로그의 경우 도구 검색 요청 페이로드가 더 작습니다.
6. 세션 로그에 예상 도구 호출 횟수와 브리지된 호출 텔레메트리가 표시됩니다.

## 실패 동작

도구 검색은 닫힌 방식으로 실패해야 합니다.

- 도구가 유효 정책에 없으면 검색은 해당 도구를 반환하지 않아야 합니다
- 선택한 도구를 사용할 수 없게 되면 `tool_call`은 실패해야 합니다
- 정책 또는 승인이 실행을 차단하면 호출 결과는 이를 우회하지 않고
  해당 차단을 보고해야 합니다
- 코드 브리지가 격리된 런타임을 만들 수 없으면 해당 배포에 `mode: "tools"`를 사용하거나
  도구 검색을 비활성화하세요

## 관련 항목

- [도구와 plugins](/ko/tools)
- [다중 에이전트 샌드박스와 도구](/ko/tools/multi-agent-sandbox-tools)
- [Exec 도구](/ko/tools/exec)
- [ACP 에이전트 설정](/ko/tools/acp-agents-setup)
- [plugins 빌드하기](/ko/plugins/building-plugins)
