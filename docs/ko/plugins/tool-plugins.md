---
read_when:
    - 간단한 OpenClaw Plugin을 빌드하여 에이전트 도구만 추가하려고 합니다
    - Plugin 매니페스트 메타데이터를 직접 작성하는 대신 defineToolPlugin을 사용하려는 경우
    - 도구 전용 Plugin을 스캐폴드하거나, 생성하거나, 검증하거나, 테스트하거나, 게시해야 합니다
sidebarTitle: Tool Plugins
summary: defineToolPlugin 및 openclaw plugins init/build/validate로 간단한 타입 지정 에이전트 도구 빌드
title: 도구 Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

도구 플러그인은 채널, 모델 제공자, 훅, 서비스 또는 설정 백엔드를 추가하지 않고 OpenClaw에 에이전트가 호출할 수 있는 도구를 추가합니다. 플러그인이 고정된 도구 목록을 소유하고, OpenClaw가 런타임 코드를 로드하지 않아도 해당 도구를 검색 가능하게 유지하는 매니페스트 메타데이터를 생성하게 하려면 `defineToolPlugin`을 사용하세요.

권장 흐름은 다음과 같습니다.

1. `openclaw plugins init`으로 패키지를 스캐폴드합니다.
2. `defineToolPlugin`으로 도구를 작성합니다.
3. JavaScript를 빌드합니다.
4. `openclaw plugins build`로 `openclaw.plugin.json` 및 `package.json` 메타데이터를 생성합니다.
5. 게시하거나 설치하기 전에 생성된 메타데이터를 검증합니다.

제공자, 채널, 훅, 서비스 또는 혼합 기능 플러그인은 대신 [플러그인 빌드](/ko/plugins/building-plugins), [채널 Plugin](/ko/plugins/sdk-channel-plugins) 또는 [제공자 Plugin](/ko/plugins/sdk-provider-plugins)부터 시작하세요.

## 요구 사항

- Node >= 22.
- TypeScript ESM 패키지 출력.
- 구성 및 도구 매개변수 스키마용 `typebox`.
- `openclaw/plugin-sdk/tool-plugin`을 내보내는 첫 OpenClaw 버전인 `openclaw >=2026.5.17`.
- `dist/`, `openclaw.plugin.json`, `package.json`을 배포할 수 있는 패키지 루트.

생성된 플러그인은 런타임에 `typebox`를 가져오므로 `typebox`를 `devDependencies`뿐만 아니라 `dependencies`에 유지하세요.

## 빠른 시작

새 플러그인 패키지를 만듭니다.

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

스캐폴드는 다음을 생성합니다.

- `src/index.ts`: `echo` 도구가 있는 `defineToolPlugin` 엔트리.
- `src/index.test.ts`: 작은 메타데이터 테스트.
- `tsconfig.json`: `dist/`로 출력되는 NodeNext TypeScript.
- `package.json`: 스크립트, 런타임 의존성, `openclaw.extensions: ["./dist/index.js"]`.
- `openclaw.plugin.json`: 초기 도구를 위한 생성된 매니페스트 메타데이터.

예상 검증 출력:

```text
Plugin stock-quotes is valid.
```

## 도구 작성

`defineToolPlugin`은 플러그인 ID, 선택적 구성 스키마, 정적 도구 목록을 받습니다. 매개변수 및 구성 타입은 TypeBox 스키마에서 추론됩니다.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

도구 이름은 안정적인 API입니다. 코어 도구나 다른 플러그인과 충돌하지 않도록 고유하고 소문자이며 충분히 구체적인 이름을 선택하세요.

## 선택적 도구와 팩터리 도구

모델로 보내기 전에 사용자가 도구를 명시적으로 허용 목록에 추가해야 하는 경우 `optional: true`를 설정하세요.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build`는 일치하는 `toolMetadata.<tool>.optional` 매니페스트 엔트리를 작성하므로, OpenClaw는 플러그인 런타임 코드를 로드하지 않고도 도구를 검색할 수 있습니다.

도구를 만들기 전에 런타임 도구 컨텍스트가 필요한 경우 `factory`를 사용하세요. 팩터리는 메타데이터를 정적으로 유지하면서 도구가 특정 실행에서 제외되거나, 샌드박스 상태를 검사하거나, 런타임 헬퍼를 바인딩할 수 있게 합니다.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

팩터리는 여전히 고정된 도구 이름을 위한 것입니다. 플러그인이 도구 이름을 동적으로 계산하거나 도구를 훅, 서비스, 제공자, 명령 또는 다른 런타임 표면과 결합하는 경우 `definePluginEntry`를 직접 사용하세요.

## 반환 값

`defineToolPlugin`은 일반 반환 값을 OpenClaw 도구 결과 형식으로 감쌉니다.

- 모델이 정확히 해당 텍스트를 보아야 하는 경우 문자열을 반환합니다.
- 모델이 형식화된 JSON을 보고, OpenClaw가 원래 값을 `details`에 유지하기를 원하는 경우 JSON 호환 값을 반환합니다.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

사용자 지정 `AgentToolResult`를 반환하거나 기존 `api.registerTool` 구현을 재사용해야 하는 경우 팩터리 도구를 사용하세요. 완전히 동적인 도구 또는 혼합 플러그인 기능이 필요한 경우 `defineToolPlugin` 대신 `definePluginEntry`를 사용하세요.

## 구성

`configSchema`는 선택 사항입니다. 생략하면 OpenClaw는 엄격한 빈 객체 스키마를 사용하며, 생성된 매니페스트에는 여전히 `configSchema`가 포함됩니다.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

`configSchema`를 포함하면 두 번째 `execute` 인수는 스키마에서 타입이 지정됩니다.

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw는 Gateway 구성의 플러그인 엔트리에서 플러그인 구성을 읽습니다. 소스나 문서 예제에 비밀 값을 하드코딩하지 마세요. 플러그인의 보안 모델에 따라 구성, 환경 변수 또는 SecretRefs를 사용하세요.

## 생성된 메타데이터

OpenClaw는 콜드 메타데이터에서 설치된 플러그인을 검색합니다. 플러그인 런타임 코드를 가져오기 전에 플러그인 매니페스트를 읽을 수 있어야 합니다. 따라서 `defineToolPlugin`은 정적 메타데이터를 노출하고, `openclaw plugins build`는 해당 메타데이터를 패키지에 기록합니다.

플러그인 ID, 이름, 설명, 구성 스키마, 활성화 또는 도구 이름을 변경한 후에는 생성기를 실행하세요.

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

도구가 하나인 플러그인의 경우 생성된 매니페스트는 다음과 같습니다.

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools`는 중요한 검색 계약입니다. 이는 설치된 모든 플러그인 런타임을 로드하지 않고도 어떤 플러그인이 각 도구를 소유하는지 OpenClaw에 알려줍니다. 매니페스트가 오래되면 도구가 검색에서 누락되거나 등록 오류의 원인으로 잘못된 플러그인이 지목될 수 있습니다.

## 패키지 메타데이터

단순한 도구 플러그인 워크플로에서는 `openclaw plugins build`가 `package.json`을 선택한 단일 런타임 엔트리에 맞춥니다.

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

설치된 패키지에는 `./dist/index.js` 같은 빌드된 JavaScript를 사용하세요. 소스 엔트리는 워크스페이스 개발에는 유용하지만, 게시된 패키지는 TypeScript 런타임 로딩에 의존해서는 안 됩니다.

## CI에서 검증

생성된 메타데이터가 오래되었을 때 파일을 다시 쓰지 않고 CI를 실패시키려면 `plugins build --check`를 사용하세요.

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate`는 다음을 확인합니다.

- `openclaw.plugin.json`이 존재하고 일반 매니페스트 로더를 통과합니다.
- 현재 엔트리가 `defineToolPlugin` 메타데이터를 내보냅니다.
- 생성된 매니페스트 필드가 엔트리 메타데이터와 일치합니다.
- `contracts.tools`가 선언된 도구 이름과 일치합니다.
- `package.json`이 `openclaw.extensions`를 선택한 런타임 엔트리로 가리킵니다.

## 로컬에서 설치 및 검사

별도의 OpenClaw 체크아웃 또는 설치된 CLI에서 패키지 경로를 설치합니다.

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

패키징된 스모크를 위해서는 먼저 패킹한 뒤 tarball을 설치합니다.

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

설치 후 Gateway를 시작하거나 재시작하고 에이전트에게 도구를 사용하도록 요청하세요. 도구 가시성을 디버그하는 경우 코드를 변경하기 전에 플러그인 런타임과 유효한 도구 카탈로그를 검사하세요.

## 게시

패키지가 준비되면 ClawHub를 통해 게시합니다.

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

명시적 ClawHub 로케이터로 설치합니다.

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

출시 전환 기간 동안에는 기본 npm 패키지 명세도 계속 지원되지만, ClawHub가 OpenClaw 플러그인의 선호 검색 및 배포 표면입니다.

## 문제 해결

### `plugin entry not found: ./dist/index.js`

선택한 엔트리 파일이 존재하지 않습니다. `npm run build`를 실행한 다음 `openclaw plugins build --entry ./dist/index.js` 또는 `openclaw plugins validate --entry ./dist/index.js`를 다시 실행하세요.

### `plugin entry does not expose defineToolPlugin metadata`

엔트리가 `defineToolPlugin`으로 생성된 값을 내보내지 않았습니다. 모듈의 기본 내보내기가 `defineToolPlugin(...)` 결과인지 확인하거나, `--entry`로 올바른 엔트리를 전달하세요.

### `openclaw.plugin.json generated metadata is stale`

매니페스트가 더 이상 엔트리 메타데이터와 일치하지 않습니다. 다음을 실행하세요.

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

`openclaw.plugin.json` 및 `package.json` 변경 사항을 모두 커밋하세요.

### `package.json openclaw.extensions must include ./dist/index.js`

패키지 메타데이터가 다른 런타임 엔트리를 가리킵니다. 생성기가 패키지 메타데이터를 배포하려는 엔트리에 맞추도록 `openclaw plugins build --entry ./dist/index.js`를 실행하세요.

### `Cannot find package 'typebox'`

빌드된 플러그인은 런타임에 `typebox`를 가져옵니다. `typebox`를 `dependencies`에 유지하고, 패키지 의존성을 다시 설치하고, 다시 빌드한 뒤 검증을 다시 실행하세요.

### 설치 후 도구가 나타나지 않음

다음을 순서대로 확인하세요.

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json`에 예상 도구 이름이 포함된 `contracts.tools`가 있습니다.
4. `package.json`에 `openclaw.extensions: ["./dist/index.js"]`가 있습니다.
5. 플러그인을 설치한 후 Gateway가 재시작되었거나 다시 로드되었습니다.

## 함께 보기

- [플러그인 빌드](/ko/plugins/building-plugins)
- [플러그인 엔트리 포인트](/ko/plugins/sdk-entrypoints)
- [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)
- [플러그인 매니페스트](/ko/plugins/manifest)
- [Plugins CLI](/ko/cli/plugins)
- [ClawHub 게시](/ko/clawhub/publishing)
