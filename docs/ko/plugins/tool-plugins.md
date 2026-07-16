---
read_when:
    - 에이전트 도구만 추가하는 간단한 OpenClaw Plugin을 빌드하려고 합니다
    - Plugin 매니페스트 메타데이터를 직접 작성하는 대신 defineToolPlugin을 사용하려고 합니다
    - 도구 전용 Plugin을 스캐폴딩, 생성, 검증, 테스트 또는 게시해야 합니다
sidebarTitle: Tool Plugins
summary: defineToolPlugin 및 openclaw plugins init/build/validate로 간단한 타입 지정 에이전트 도구를 구축하십시오
title: 도구 Plugin
x-i18n:
    generated_at: "2026-07-16T12:59:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin`는 에이전트가 호출할 수 있는 도구만 추가하는 Plugin을 빌드합니다. 채널, 모델 제공자, 훅, 서비스 또는 설정 백엔드는 추가하지 않습니다. Plugin 런타임 코드를 로드하지 않고도 OpenClaw가 도구를 검색하는 데 필요한 매니페스트 메타데이터를 생성합니다.

제공자, 채널, 훅, 서비스 또는 여러 기능이 혼합된 Plugin의 경우에는 대신 [Plugin 빌드](/ko/plugins/building-plugins), [채널 Plugin](/ko/plugins/sdk-channel-plugins) 또는 [제공자 Plugin](/ko/plugins/sdk-provider-plugins)부터 시작하십시오.

## 요구 사항

- Node 22.22.3+, Node 24.15+ 또는 Node 25.9+.
- TypeScript ESM 패키지 출력.
- `typebox`이 `dependencies`에 있어야 합니다(`devDependencies`에만 있으면 안 됩니다. 생성된 Plugin이 런타임에 이를 가져옵니다).
- `openclaw >=2026.5.17`, 즉 `openclaw/plugin-sdk/tool-plugin`를 내보내는 최초 버전.
- `dist/`, `openclaw.plugin.json` 및 `package.json`을 배포하는 패키지 루트.

## 빠른 시작

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init`는 다음을 스캐폴딩합니다.

| 파일                   | 용도                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | 하나의 `echo` 도구가 있는 `defineToolPlugin` 진입점             |
| `src/index.test.ts`    | 도구 목록을 검증하는 메타데이터 테스트                              |
| `tsconfig.json`        | `dist/`으로 출력하는 NodeNext TypeScript                       |
| `vitest.config.ts`     | `src/**/*.test.ts`용 Vitest 구성                                    |
| `package.json`         | 스크립트, 런타임 의존성, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | 초기 도구용으로 생성된 매니페스트 메타데이터                         |

`npm run plugin:build`는 `npm run build`(tsc)을 실행한 다음 `openclaw plugins build --entry ./dist/index.js`을 실행합니다. `npm run plugin:validate`는 다시 빌드한 후 `openclaw plugins validate --entry ./dist/index.js`를 실행합니다.
검증에 성공하면 다음이 출력됩니다.

```text
Plugin stock-quotes이(가) 유효합니다.
```

`openclaw plugins init <id>` 옵션:

| 플래그                 | 기본값             | 효과                                   |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | 출력 디렉터리                          |
| `--name <name>`      | 제목 형식의 `<id>` | 표시 이름                              |
| `--type <type>`      | `tool`             | 스캐폴드 유형: `tool` 또는 `provider` |
| `--force`            | 꺼짐               | 기존 출력 디렉터리 덮어쓰기             |

## 도구 작성

`defineToolPlugin`는 Plugin 식별 정보, 선택적 구성 스키마 및 정적 도구 목록을 받습니다. 매개변수 및 구성 유형은 TypeBox 스키마에서 추론됩니다.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "주식 시세 스냅샷을 가져옵니다.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "시세 API 키입니다." })),
    baseUrl: Type.Optional(Type.String({ description: "시세 API 기본 URL입니다." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "주식 시세",
      description: "주식 시세 스냅샷을 가져옵니다.",
      parameters: Type.Object({
        symbol: Type.String({ description: "티커 기호입니다(예: OPEN)." }),
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

도구 이름은 안정적인 API입니다. 고유하고 소문자로 구성되며 코어 도구 또는 다른 Plugin과의 충돌을 피할 수 있을 만큼 구체적인 이름을 선택하십시오.

## 선택적 도구 및 팩토리 도구

사용자가 모델에 도구를 전송하기 전에 명시적으로 허용 목록에 추가해야 하는 경우 `optional: true`을 설정하십시오. `openclaw plugins build`은 일치하는 `toolMetadata.<tool>.optional` 매니페스트 항목을 작성하므로, OpenClaw는 Plugin 런타임 코드를 로드하지 않고도 해당 도구가 선택 사항임을 확인할 수 있습니다.

```typescript
tool({
  name: "workflow_run",
  description: "외부 워크플로를 실행합니다.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

도구를 생성하기 전에 런타임 도구 컨텍스트가 필요한 경우 `factory`을 사용하십시오. 특정 실행에서 제외하거나, 샌드박스 상태를 검사하거나, 런타임 도우미를 바인딩할 때 사용할 수 있습니다. 구체적인 도구가 런타임에 빌드되더라도 메타데이터는 정적으로 유지됩니다.

```typescript
tool({
  name: "local_workflow",
  description: "샌드박스 세션 외부에서 로컬 워크플로를 실행합니다.",
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

팩토리도 고정된 도구 이름을 미리 선언합니다. Plugin이 도구 이름을 동적으로 계산하거나 도구를 훅, 서비스, 제공자 또는 명령과 결합하는 경우에는 `definePluginEntry`을 직접 사용하십시오.

## 반환값

`defineToolPlugin`는 일반 반환값을 OpenClaw 도구 결과 형식으로 래핑합니다.

- 모델에 정확히 해당 텍스트를 표시해야 하는 경우 문자열을 반환하십시오.
- 모델에 형식이 지정된 JSON을 표시하고 OpenClaw가 원래 값을 `details`에 유지하도록 하려면 JSON 호환 값을 반환하십시오.

```typescript
tool({
  name: "echo_text",
  description: "입력 텍스트를 그대로 반환합니다.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "입력을 구조화된 JSON으로 그대로 반환합니다.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

사용자 지정 `AgentToolResult`이 필요하거나 기존 `api.registerTool` 구현을 재사용하려는 경우 팩토리 도구를 사용하십시오.

## 구성

`configSchema`는 선택 사항입니다. 이를 생략하면 OpenClaw가 엄격한 빈 객체 스키마를 적용하며, 생성된 매니페스트에는 여전히 `configSchema`이 포함됩니다.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "구성이 필요하지 않은 도구를 추가합니다.",
  tools: () => [],
});
```

`configSchema`을 사용하면 두 번째 `execute` 인수의 유형이 여기에서 추론됩니다.

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "구성된 도구를 추가합니다.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "구성을 사용할 수 있는지 확인합니다.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw는 Gateway 구성에 있는 해당 Plugin의 항목에서 Plugin 구성을 읽습니다. 소스나 문서 예제에 비밀을 하드코딩하지 마십시오. Plugin의 보안 모델에 따라 구성, 환경 변수 또는 SecretRef를 사용하십시오.

## 생성된 메타데이터

OpenClaw는 Plugin 런타임 코드를 가져오기 전에 Plugin 매니페스트를 읽어야 합니다. `defineToolPlugin`은 이를 위한 정적 메타데이터를 노출하고, `openclaw plugins build`은 이를 패키지에 작성합니다. Plugin ID, 이름, 설명, 구성 스키마, 활성화 또는 도구 이름을 변경한 후에는 생성기를 다시 실행하십시오.

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

도구가 하나인 Plugin에 대해 생성된 매니페스트:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "주식 시세 스냅샷을 가져옵니다.",
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

`contracts.tools`은 중요한 검색 계약입니다. 설치된 모든 Plugin의 런타임을 로드하지 않고도 어떤 Plugin이 각 도구를 소유하는지 OpenClaw에 알려 줍니다. 오래된 매니페스트로 인해 검색에서 도구가 누락되거나 등록 오류가 잘못된 Plugin의 문제로 처리될 수 있습니다.

## 패키지 메타데이터

`openclaw plugins build`은 선택한 런타임 진입점에 맞게 `package.json`도 조정합니다.

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

TypeScript 소스 진입점이 아니라 빌드된 JavaScript(`./dist/index.js`)를 배포하십시오. 소스 진입점은 워크스페이스 로컬 개발에서만 작동합니다.

## CI에서 검증

생성된 메타데이터가 오래된 경우 `plugins build --check`는 파일을 다시 작성하지 않고 실패합니다.

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate`는 다음을 확인합니다.

- `openclaw.plugin.json`이 존재하고 일반 매니페스트 로더를 통과합니다.
- 현재 진입점이 `defineToolPlugin` 메타데이터를 내보냅니다.
- 생성된 매니페스트 필드가 진입점 메타데이터와 일치합니다.
- `contracts.tools`이 선언된 도구 이름과 일치합니다.
- `package.json`이 `openclaw.extensions`에서 선택한 런타임 진입점을 가리킵니다.

## 로컬에서 설치 및 검사

별도의 OpenClaw 체크아웃 또는 설치된 CLI에서 패키지 경로를 설치하십시오.

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

패키징된 스모크 테스트를 수행하려면 먼저 패키징한 다음 tarball을 설치하십시오.

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

설치 후 Gateway를 재시작하거나 다시 로드하고 에이전트에게 도구를 사용하도록 요청하십시오. 도구가 표시되지 않으면 코드를 변경하기 전에 Plugin 런타임과 실제 도구 카탈로그를 검사하십시오([문제 해결](#troubleshooting) 참조).

## 게시

패키지가 준비되면 ClawHub를 통해 게시하십시오. `clawhub package publish`은 로컬 폴더, GitHub 저장소(`owner/repo[@ref]`) 또는 tarball URL을 소스로 받습니다.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

명시적인 ClawHub 로케이터를 사용하여 설치하십시오.

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

출시 전환 기간에는 접두사 없는 npm 패키지 사양도 계속 npm에서 설치되지만, OpenClaw Plugin의 검색 및 배포에는 ClawHub가 권장됩니다. 소유자 범위 및 릴리스 검토에 대해서는 [ClawHub 게시](/ko/clawhub/publishing)를 참조하십시오.

## 문제 해결

### `plugin entry not found: ./dist/index.js`

선택한 진입점 파일이 존재하지 않습니다. `npm run build`을 실행한 다음 `openclaw plugins build --entry ./dist/index.js` 또는 `openclaw plugins validate --entry ./dist/index.js`을 다시 실행하십시오.

### `plugin entry does not expose defineToolPlugin metadata`

진입점이 `defineToolPlugin`에서 생성된 값을 내보내지 않았습니다. 모듈의 기본 내보내기가 `defineToolPlugin(...)` 결과인지 확인하거나 `--entry`을 사용하여 올바른 진입점을 전달하십시오.

### `openclaw.plugin.json generated metadata is stale`

매니페스트가 더 이상 진입점 메타데이터와 일치하지 않습니다. 다음을 실행하십시오.

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

`openclaw.plugin.json` 및 `package.json` 변경 사항을 모두 커밋하십시오.

### `package.json openclaw.extensions must include ./dist/index.js`

패키지 메타데이터가 다른 런타임 진입점을 가리킵니다. 생성기가 배포하려는 진입점에 맞게 패키지 메타데이터를 조정하도록 `openclaw plugins build --entry ./dist/index.js`을 실행하십시오.

### `Cannot find package 'typebox'`

빌드된 Plugin은 런타임에 `typebox`을 가져옵니다. 이를 `dependencies`에 유지하고 다시 설치 및 빌드한 후 검증을 다시 실행하십시오.

### 설치 후 도구가 표시되지 않음

다음 항목을 순서대로 확인하십시오.

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json`에는 예상한 도구 이름을 사용하는 `contracts.tools`이 있습니다.
4. `package.json`에는 `openclaw.extensions: ["./dist/index.js"]`이 있습니다.
5. Plugin을 설치한 후 Gateway가 다시 시작되었거나 다시 로드되었습니다.

## 함께 보기

- [Plugin 빌드](/ko/plugins/building-plugins)
- [Plugin 진입점](/ko/plugins/sdk-entrypoints)
- [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)
- [Plugin 매니페스트](/ko/plugins/manifest)
- [Plugin CLI](/ko/cli/plugins)
- [ClawHub 게시](/ko/clawhub/publishing)
