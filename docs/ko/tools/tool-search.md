---
read_when:
    - 모든 도구 스키마를 프롬프트에 추가하지 않고도 OpenClaw 에이전트가 대규모 도구 카탈로그를 사용하도록 하려는 경우
    - 하나의 간결한 런타임 인터페이스를 통해 OpenClaw 도구, MCP 도구 및 클라이언트 도구를 제공하려고 합니다
    - OpenClaw 실행의 도구 검색을 구현하거나 디버깅하고 있습니다.
summary: '도구 검색: 대규모 OpenClaw 도구 카탈로그를 검색, 설명, 호출로 간소화하기'
title: 도구 검색
x-i18n:
    generated_at: "2026-07-12T15:51:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6608a2de3b8ec03d3bb182d5909bb73429f623af8cebb34bc38856cb9d8b8c32
    source_path: tools/tool-search.md
    workflow: 16
---

Tool Search는 실험적인 OpenClaw 에이전트 런타임 기능입니다. 에이전트가 대규모 도구 카탈로그를 검색하고 호출할 수 있는 하나의 간결한 방법을 제공합니다. 실행에 사용 가능한 도구가 많지만 모델이 그중 일부만 필요로 할 가능성이 높은 경우 유용합니다.

이 페이지에서는 OpenClaw Tool Search를 설명합니다. 이는 Codex 네이티브 도구 검색 또는 동적 도구 표면이 아닙니다. Codex 네이티브 코드 모드, 도구 검색, 지연된 동적 도구 및 중첩 도구 호출은 안정적인 Codex 하네스 표면이며 `tools.toolSearch`에 의존하지 않습니다.

OpenClaw 실행에 활성화하면 모델은 기본적으로 하나의 `tool_search_code` 도구와, 구조화된 결과가 간결한 브리지를 통과할 수 없는 직접 전용 도구를 받습니다. 코드 도구는 격리된 Node 하위 프로세스에서 `openclaw.tools` 브리지와 함께 짧은 JavaScript 본문을 실행합니다.

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

카탈로그에는 카탈로그 등록이 가능한 OpenClaw 도구, Plugin 도구, MCP 도구 및 클라이언트가 제공한 도구가 포함될 수 있습니다. 모델은 카탈로그에 등록된 모든 스키마를 처음부터 확인하지 않습니다. 대신 간결한 설명자를 검색하고, 정확한 스키마가 필요할 때 선택한 도구 하나를 설명한 다음, OpenClaw를 통해 해당 도구를 호출합니다. 직접 전용 도구는 계속 모델에 표시되며 카탈로그에 추가되지 않습니다.

Codex 하네스 실행에는 이러한 실험적 OpenClaw Tool Search 제어가 제공되지 않습니다. OpenClaw는 제품 기능을 동적 도구로 Codex에 전달하며, 안정적인 네이티브 코드 모드, 네이티브 도구 검색, 지연된 동적 도구 및 중첩 도구 호출은 Codex가 소유합니다.

## 턴 실행 방식

계획 시점에 OpenClaw 내장 러너는 실행에 사용할 유효 카탈로그를 구성합니다.

1. 에이전트, 프로필, 샌드박스 및 세션의 활성 도구 정책을 확인합니다.
2. 사용 가능한 OpenClaw 및 Plugin 도구를 나열합니다.
3. 세션 MCP 런타임을 통해 사용 가능한 MCP 도구를 나열합니다.
4. 현재 실행에 제공된 사용 가능한 클라이언트 도구를 추가합니다.
5. 직접 전용 도구는 모델에 계속 표시하고, 나머지 카탈로그 등록 가능 도구의 간결한 설명자를 인덱싱합니다.
6. 해당 직접 전용 도구와 함께 OpenClaw 코드 브리지, 구조화된 폴백 도구 또는 간결한 디렉터리 표면을 노출합니다.

실행 시점에 모든 실제 도구 호출은 OpenClaw로 돌아옵니다. 격리된 Node 런타임에는 Plugin 구현, MCP 클라이언트 객체 또는 비밀 정보가 포함되지 않습니다. `openclaw.tools.call(...)`은 브리지를 건너 Gateway로 돌아가며, 여기에서도 일반적인 정책, 승인, 훅, 로깅 및 결과 처리가 계속 적용됩니다.

## 모드

`tools.toolSearch`에는 모델에 표시되는 세 가지 모드가 있습니다.

- `code`: 직접 전용 도구와 함께 기본 간결한 JavaScript 브리지인 `tool_search_code`를 노출합니다.
- `tools`: 코드를 받지 않아야 하는 제공자를 위해 직접 전용 도구와 함께 `tool_search`, `tool_describe`, `tool_call`을 일반 구조화 도구로 노출합니다.
- `directory`: 모든 전체 스키마를 제공하지 않고도 도구 이름을 확인해야 하는 제공자를 위해 `tool_search`, `tool_describe`, `tool_call`과 사용 가능한 도구 이름 및 설명이 포함된 제한된 프롬프트 디렉터리를 노출합니다. OpenClaw는 현재 턴에 필요할 가능성이 높거나 필수적인 소규모의 제한된 도구 스키마 집합을 직접 노출할 수도 있습니다. 이 모드에서도 직접 전용 도구는 계속 표시됩니다.

모든 모드는 동일하게 정책으로 필터링된 카탈로그와 일반적인 OpenClaw 실행 경로를 사용합니다. `catalogMode: "direct-only"`로 표시된 도구는 해당 카탈로그 외부에 유지되며 계속 모델에 표시됩니다. 현재 런타임에서 격리된 Node 코드 모드 하위 프로세스를 시작할 수 없으면 기본 `code` 모드는 카탈로그 압축 전에 `tools`로 폴백합니다. `directory` 모드에서는 현재 실행 동안 클라이언트 제공 도구가 계속 직접 표시되는 한편, OpenClaw 도구, Plugin 도구 및 MCP 도구는 디렉터리 카탈로그 뒤에 압축될 수 있습니다. 정확한 숨겨진 디렉터리 이름을 직접 호출하면 실행 전에 동일한 승인된 카탈로그에서 해당 도구를 구체화합니다.

모든 모드는 실험적입니다. 소규모 OpenClaw 도구 카탈로그에는 직접 도구 노출을 권장하며, Codex 하네스 실행에는 안정적인 Codex 네이티브 표면을 권장합니다.

별도의 소스 선택 설정은 없습니다. Tool Search가 활성화되면 카탈로그에는 일반 정책 필터링 후 카탈로그 등록이 가능한 OpenClaw, MCP 및 클라이언트 도구가 포함되며, 직접 전용 도구는 별도로 유지됩니다.

## 존재 이유

대규모 카탈로그는 유용하지만 비용이 많이 듭니다. 모든 도구 스키마를 모델에 전송하면 요청이 커지고 계획이 느려지며 실수로 도구를 선택할 가능성이 높아집니다.

Tool Search는 구성을 다음과 같이 바꿉니다.

- 직접 도구: 모델은 첫 번째 토큰 전에 선택된 모든 스키마를 확인합니다.
- Tool Search 코드 모드: 모델은 하나의 간결한 코드 도구, 짧은 API 계약 및 모든 직접 전용 도구를 확인합니다.
- Tool Search 도구 모드: 모델은 세 개의 간결한 구조화된 폴백 도구와 모든 직접 전용 도구를 확인합니다.
- Tool Search 디렉터리 모드: 모델은 제한된 디렉터리, 검색/설명/호출 제어, 필요할 가능성이 높거나 필수적인 소규모의 제한된 스키마 집합 및 모든 직접 전용 도구를 확인합니다.
- 턴 도중: 모델은 필요에 따라 나머지 스키마를 불러올 수 있습니다.

소규모 카탈로그에는 직접 도구 노출이 여전히 적절한 기본값입니다. Tool Search는 하나의 실행에서 많은 도구, 특히 MCP 서버 또는 클라이언트가 제공한 앱 도구를 확인할 수 있을 때 가장 적합합니다.

## API

`openclaw.tools.search(query, options?)`

현재 실행의 유효 카탈로그를 검색합니다. 결과는 간결하며 프롬프트 컨텍스트에 안전하게 다시 넣을 수 있습니다.

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

정확한 입력 스키마를 포함하여 검색 결과 하나의 전체 메타데이터를 불러옵니다.

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

구조화된 폴백 모드는 동일한 작업을 다음 도구로 노출합니다.

- `tool_search`
- `tool_describe`
- `tool_call`

디렉터리 모드는 다음을 노출합니다.

- `tool_search`
- `tool_describe`
- `tool_call`

또한 클라이언트 제공 도구와 모든 직접 전용 도구를 계속 직접 표시하며, 현재 턴에 필요할 가능성이 높거나 필수적인 소규모의 제한된 카탈로그 도구 스키마 집합을 직접 노출할 수 있습니다. 제한된 디렉터리에 항목이 없으면 `tool_search`를 사용하여 찾으십시오. 모델이 숨겨진 디렉터리 도구의 정확한 이름을 직접 요청하면 OpenClaw는 일반 실행 전에 승인된 카탈로그에서 해당 도구를 구체화합니다.
정확한 지연 디스패치에 이러한 이름이 사용되므로 디렉터리 모드의 클라이언트 도구 이름은 OpenClaw, Plugin 또는 MCP 도구 이름과 충돌해서는 안 됩니다.

## 런타임 경계

코드 브리지는 수명이 짧은 Node 하위 프로세스에서 실행됩니다. 하위 프로세스는 Node 권한 모드가 활성화되고, 환경은 비어 있으며, 파일 시스템 또는 네트워크 권한과 하위 프로세스 또는 워커 권한은 없는 상태로 시작됩니다. OpenClaw는 상위 프로세스에서 실제 경과 시간 제한을 적용하며 비동기 연속 실행 이후를 포함하여 시간 초과 시 하위 프로세스를 종료합니다.

런타임은 다음 항목만 노출합니다.

- `console.log`, `console.warn`, `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

최종 호출에도 일반적인 OpenClaw 동작이 계속 적용됩니다.

- 도구 허용 및 거부 정책
- 에이전트별 및 샌드박스별 도구 제한
- 채널/런타임 도구 정책
- 승인 훅
- Plugin `before_tool_call` 훅
- 세션 ID, 로그 및 텔레메트리

## 설정

기본 코드 브리지로 OpenClaw 실행에 Tool Search를 활성화합니다.

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

OpenClaw 실행에 구조화된 폴백 도구를 대신 사용합니다.

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

OpenClaw 실행에 간결한 디렉터리 표면을 대신 사용합니다.

```json5
{
  tools: {
    toolSearch: {
      mode: "directory",
    },
  },
}
```

코드 모드의 시간 제한과 검색 결과 제한을 조정합니다(표시된 값은 기본값입니다).

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

런타임은 `codeTimeoutMs`를 1000-60000으로, `maxSearchLimit`를 1-50으로, `searchDefaultLimit`를 1..`maxSearchLimit`로 제한합니다.

비활성화합니다.

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## 프롬프트 및 텔레메트리

Tool Search는 직접 도구 노출과 비교할 수 있도록 충분한 텔레메트리를 기록합니다.

- 하네스에 전송된 직렬화된 도구 및 프롬프트의 총 바이트 수
- 카탈로그 크기 및 소스별 구성
- 검색, 설명 및 호출 횟수
- OpenClaw를 통해 실행된 최종 도구 호출
- 선택된 도구 ID 및 소스

세션 로그를 통해 다음 질문에 답할 수 있어야 합니다.

- 모델이 처음부터 확인한 도구 스키마 수
- 모델이 수행한 검색 및 설명 작업 수
- 호출된 최종 도구
- 결과가 OpenClaw, MCP 또는 클라이언트 도구에서 왔는지 여부

## E2E 검증

QA Lab Gateway 시나리오는 OpenClaw 런타임으로 두 경로를 모두 검증합니다.

```bash
pnpm openclaw qa suite --provider-mode mock-openai --scenario tool-search-gateway-e2e
```

대규모 도구 카탈로그가 있는 임시 가짜 Plugin을 만들고, 모의 OpenAI 제공자를 시작한 다음, 직접 모드에서 한 번, Tool Search가 활성화된 상태에서 한 번 Gateway를 시작하여 제공자 요청 페이로드와 세션 로그를 비교합니다.

회귀 검증에서는 다음을 확인합니다.

1. 직접 모드에서 가짜 Plugin 도구를 호출할 수 있습니다.
2. Tool Search에서 동일한 가짜 Plugin 도구를 호출할 수 있습니다.
3. 직접 모드는 가짜 Plugin 도구 스키마를 제공자에게 직접 노출합니다.
4. Tool Search는 간결한 브리지와 모든 직접 전용 도구만 노출합니다.
5. 대규모 가짜 카탈로그에서는 Tool Search 요청 페이로드가 더 작습니다.
6. 세션 로그에 예상된 도구 호출 횟수와 브리지 호출 텔레메트리가 표시됩니다.

## 실패 동작

Tool Search는 실패 시 차단해야 합니다.

- 도구가 유효 정책에 포함되지 않으면 검색에서 반환해서는 안 됩니다.
- 선택한 도구를 사용할 수 없게 되면 `tool_call`이 실패해야 합니다.
- 정책 또는 승인이 실행을 차단하면 호출 결과는 이를 우회하지 않고 해당 차단을 보고해야 합니다.
- 코드 브리지가 격리된 런타임을 만들 수 없으면 해당 배포에 `mode: "tools"`를 사용하거나 Tool Search를 비활성화하십시오.

## 관련 문서

- [도구 및 Plugin](/ko/tools)
- [멀티 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools)
- [실행 도구](/ko/tools/exec)
- [ACP 에이전트 설정](/ko/tools/acp-agents-setup)
- [Plugin 빌드하기](/ko/plugins/building-plugins)
