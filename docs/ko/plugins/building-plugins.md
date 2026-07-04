---
doc-schema-version: 1
read_when:
    - 새 OpenClaw Plugin을 만들려고 합니다
    - Plugin 개발을 위한 빠른 시작이 필요합니다
    - 채널, 공급자, CLI 백엔드, 도구 또는 훅 문서 중에서 선택하고 있습니다
sidebarTitle: Getting Started
summary: 몇 분 만에 첫 OpenClaw Plugin 만들기
title: Plugin 빌드하기
x-i18n:
    generated_at: "2026-07-04T15:11:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin은 core를 변경하지 않고 OpenClaw를 확장합니다. Plugin은 메시징
채널, 모델 공급자, 로컬 CLI 백엔드, 에이전트 도구, 훅, 미디어 공급자
또는 다른 Plugin 소유 기능을 추가할 수 있습니다.

외부 Plugin을 OpenClaw 리포지토리에 추가할 필요는 없습니다. 패키지를
[ClawHub](/ko/clawhub)에 게시하면 사용자는 다음으로 설치합니다.

```bash
openclaw plugins install clawhub:<package-name>
```

베어 패키지 사양은 출시 전환 기간 동안 계속 npm에서 설치됩니다.
ClawHub 해석을 원할 때는 `clawhub:` 접두사를 사용하세요.

## 요구 사항

- Node 22.19+, Node 23.11+ 또는 Node 24+와 `npm` 또는 `pnpm` 같은 패키지 관리자를 사용하세요.
- TypeScript ESM 모듈에 익숙해야 합니다.
- 리포지토리 내 번들 Plugin 작업의 경우 리포지토리를 클론하고 `pnpm install`을 실행하세요.
  OpenClaw가 `extensions/*` 워크스페이스 패키지에서 번들
  Plugin을 로드하므로 소스 체크아웃 Plugin 개발은 pnpm 전용입니다.

## Plugin 형태 선택

<CardGroup cols={2}>
  <Card title="채널 Plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    OpenClaw를 메시징 플랫폼에 연결합니다.
  </Card>
  <Card title="공급자 Plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델, 미디어, 검색, 가져오기, 음성 또는 실시간 공급자를 추가합니다.
  </Card>
  <Card title="CLI 백엔드 Plugin" icon="terminal" href="/ko/plugins/cli-backend-plugins">
    OpenClaw 모델 폴백을 통해 로컬 AI CLI를 실행합니다.
  </Card>
  <Card title="도구 Plugin" icon="wrench" href="/ko/plugins/tool-plugins">
    에이전트 도구를 등록합니다.
  </Card>
</CardGroup>

## 빠른 시작

필수 에이전트 도구 하나를 등록하여 최소 도구 Plugin을 빌드합니다. 이는
가장 짧고 유용한 Plugin 형태이며 패키지, 매니페스트, 진입점, 로컬
증명을 보여줍니다.

<Steps>
  <Step title="패키지 메타데이터 만들기">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    게시된 외부 Plugin은 런타임 엔트리가 빌드된 JavaScript
    파일을 가리켜야 합니다. 전체 진입점 계약은
    [SDK 진입점](/ko/plugins/sdk-entrypoints)을 참조하세요.

    모든 Plugin에는 설정이 없더라도 매니페스트가 필요합니다. 런타임 도구는
    `contracts.tools`에 나타나야 OpenClaw가 모든 Plugin 런타임을
    즉시 로드하지 않고도 소유권을 발견할 수 있습니다. `activation.onStartup`을
    의도적으로 설정하세요. 이 예시는 Gateway 시작 시 시작됩니다.

    호스트가 신뢰하는 Plugin 표면도 매니페스트로 게이트되며 설치된 Plugin에 대해
    명시적 활성화가 필요합니다. 설치된 Plugin이
    `api.registerAgentToolResultMiddleware(...)`를 등록하는 경우 각 대상 런타임을
    `contracts.agentToolResultMiddleware`에 선언하세요. `api.registerTrustedToolPolicy(...)`를
    등록하는 경우 각 정책 ID를 `contracts.trustedToolPolicies`에 선언하세요.
    이러한 선언은 설치 시 검사와 런타임 등록을 일치시킵니다.

    모든 매니페스트 필드는 [Plugin 매니페스트](/ko/plugins/manifest)를 참조하세요.

  </Step>

  <Step title="도구 등록">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    채널이 아닌 Plugin에는 `definePluginEntry`를 사용하세요. 채널 Plugin은
    `defineChannelPluginEntry`를 사용합니다.

  </Step>

  <Step title="런타임 테스트">
    설치된 Plugin 또는 외부 Plugin의 경우 로드된 런타임을 검사하세요.

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin이 CLI 명령을 등록하는 경우 해당 명령도 실행하세요. 예를 들어
    데모 명령에는 `openclaw demo-plugin ping` 같은 실행 증명이 있어야 합니다.

    이 리포지토리의 번들 Plugin의 경우 OpenClaw는 `extensions/*`
    워크스페이스에서 소스 체크아웃 Plugin 패키지를 발견합니다. 가장 가까운
    대상 테스트를 실행하세요.

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="패키지 설치 테스트">
    게시하기 전에 패키지 준비가 된 Plugin을 사용자가 받게 될 동일한 설치 형태로
    테스트하세요. 먼저 빌드 단계를 추가하고, `openclaw.extensions` 같은
    런타임 엔트리가 `./dist/index.js` 같은 빌드된 JavaScript를 가리키게 하며,
    `npm pack`에 해당 `dist/` 출력이 포함되는지 확인하세요. TypeScript 소스 엔트리는
    소스 체크아웃과 로컬 개발 경로 전용입니다.

    그런 다음 Plugin을 패킹하고 `npm-pack:`으로 tarball을 설치하세요.

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:`은 OpenClaw의 관리형 Plugin별 npm 프로젝트를 사용하므로
    소스 체크아웃 테스트가 숨길 수 있는 런타임 의존성 실수를 잡아냅니다. 이는
    카탈로그에 연결된 공식 신뢰가 아니라 패키지와 의존성 형태를 증명합니다.
    런타임 import는 `dependencies` 또는 `optionalDependencies`에 있어야 합니다.
    `devDependencies`에만 남겨진 의존성은 관리형 런타임 프로젝트에 설치되지 않습니다.

    공식 또는 권한 있는 Plugin 동작의 최종 증명으로 원시 아카이브/경로 설치를
    사용하지 마세요. 원시 소스는 로컬 디버깅에는 유용하지만 npm 또는 ClawHub 설치와
    동일한 의존성 경로를 증명하지 않습니다. Plugin이 신뢰된 공식 Plugin 상태에
    의존하는 경우, 카탈로그 기반 공식 설치 또는 공식 신뢰를 기록하는 게시된 패키지
    경로를 통한 두 번째 증명을 추가하세요. 설치 루트와 의존성 소유권 세부 정보는
    [Plugin 의존성 해석](/ko/plugins/dependency-resolution)을 참조하세요.

  </Step>

  <Step title="게시">
    게시하기 전에 패키지를 검증하세요.

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    표준 ClawHub 스니펫은 `docs/snippets/plugin-publish/`에 있습니다.

  </Step>

  <Step title="설치">
    게시된 패키지를 ClawHub를 통해 설치하세요.

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## 도구 등록

도구는 필수 또는 선택 사항일 수 있습니다. 필수 도구는 Plugin이 활성화되면
항상 사용할 수 있습니다. 선택 도구는 사용자의 명시적 동의가 필요합니다.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

`api.registerTool(...)`로 등록된 모든 도구는 Plugin 매니페스트에도
선언되어야 합니다.

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

사용자는 `tools.allow`로 선택합니다.

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

선택 도구는 도구가 모델에 노출되는지 여부를 제어합니다. 도구나 훅이
모델이 선택한 뒤 작업이 실행되기 전에 승인을 요청해야 하는 경우
[Plugin 권한 요청](/ko/plugins/plugin-permission-requests)을 사용하세요.

부작용, 특수한 바이너리 또는 기본적으로 노출되어서는 안 되는 기능에는
선택 도구를 사용하세요. 도구 이름은 core 도구와 충돌해서는 안 됩니다.
충돌은 건너뛰고 Plugin 진단에 보고됩니다. `parameters`가 없는 도구 설명자 등
잘못된 등록도 같은 방식으로 건너뛰고 보고됩니다. 등록된 도구는 정책과
허용 목록 검사를 통과한 뒤 모델이 호출할 수 있는 타입이 지정된 함수입니다.

도구 팩토리는 런타임에서 제공하는 컨텍스트 객체를 받습니다. 도구가 현재 턴의
활성 모델을 기록, 표시 또는 이에 맞춰 조정해야 할 때 `ctx.activeModel`을
사용하세요. 이 객체에는 `provider`, `modelId`, `modelRef`가 포함될 수 있습니다.
이를 로컬 운영자, 설치된 Plugin 코드 또는 수정된 OpenClaw 런타임에 대한 보안 경계가
아니라 정보성 런타임 메타데이터로 취급하세요. 민감한 로컬 도구는 여전히 명시적
Plugin 또는 운영자 opt-in을 요구해야 하며, 활성 모델 메타데이터가 없거나 적합하지
않으면 닫힌 상태로 실패해야 합니다.

매니페스트는 소유권과 발견을 선언하며, 실행은 여전히 라이브 등록 도구 구현을
호출합니다. `toolMetadata.<tool>.optional: true`를
`api.registerTool(..., { optional: true })`와 일치시켜 OpenClaw가 도구가
명시적으로 허용 목록에 추가될 때까지 해당 Plugin 런타임을 로드하지 않도록 하세요.

## Import 규칙

집중된 SDK 하위 경로에서 import하세요.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

사용 중단된 루트 배럴에서 import하지 마세요.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Plugin 패키지 내부에서는 내부 import에 `api.ts` 및 `runtime-api.ts` 같은
로컬 배럴 파일을 사용하세요. 자체 Plugin을 SDK 경로를 통해 import하지 마세요.
공급자별 헬퍼는 경계가 진정으로 범용적이지 않은 한 공급자 패키지에 남겨두어야 합니다.

사용자 지정 Gateway RPC 메서드는 고급 진입점입니다. Plugin별 접두사에 유지하세요.
`config.*`, `exec.approvals.*`, `operator.admin.*`, `wizard.*`, `update.*` 같은
core 관리자 네임스페이스는 예약되어 있으며 `operator.admin`으로 해석됩니다.
`openclaw/plugin-sdk/gateway-method-runtime` 브리지는
`contracts.gatewayMethodDispatch: ["authenticated-request"]`를 선언하는 Plugin HTTP
라우트 전용으로 예약되어 있습니다.

전체 import 맵은 [Plugin SDK 개요](/ko/plugins/sdk-overview)를 참조하세요.

## 제출 전 체크리스트

<Check>**package.json**에 올바른 `openclaw` 메타데이터가 있음</Check>
<Check>**openclaw.plugin.json** 매니페스트가 존재하고 유효함</Check>
<Check>진입점이 `defineChannelPluginEntry` 또는 `definePluginEntry`를 사용함</Check>
<Check>모든 import가 집중된 `plugin-sdk/<subpath>` 경로를 사용함</Check>
<Check>내부 import가 SDK 자체 import가 아니라 로컬 모듈을 사용함</Check>
<Check>테스트가 통과함(`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check`가 통과함(리포지토리 내 Plugin)</Check>

## 베타 릴리스에 대해 테스트

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases)의 GitHub 릴리스 태그를 확인하고 `Watch` > `Releases`로 구독하세요. 베타 태그는 `v2026.3.N-beta.1` 형식입니다. 릴리스 공지를 받으려면 공식 OpenClaw X 계정 [@openclaw](https://x.com/openclaw)의 알림도 켤 수 있습니다.
2. 베타 태그가 나타나는 즉시 해당 태그로 Plugin을 테스트하세요. 안정 버전 전까지의 기간은 보통 몇 시간에 불과합니다.
3. 테스트 후 `plugin-forum` Discord 채널에 있는 Plugin 스레드에 `all good` 또는 깨진 내용을 게시하세요. 아직 스레드가 없다면 새로 만드세요.
4. 문제가 생기면 `Beta blocker: <plugin-name> - <summary>` 제목의 이슈를 열거나 업데이트하고 `beta-blocker` 라벨을 적용하세요. 스레드에 이슈 링크를 넣으세요.
5. `fix(<plugin-id>): beta blocker - <summary>` 제목으로 `main`에 PR을 열고 PR과 Discord 스레드 모두에 이슈를 링크하세요. 기여자는 PR에 라벨을 붙일 수 없으므로, 제목이 유지 관리자와 자동화를 위한 PR 측 신호입니다. PR이 있는 차단 문제는 병합되지만, PR이 없는 차단 문제는 그대로 릴리스될 수도 있습니다. 유지 관리자는 베타 테스트 중 이 스레드들을 확인합니다.
6. 무응답은 문제가 없다는 뜻입니다. 기간을 놓치면 수정 사항은 다음 주기에 반영될 가능성이 높습니다.

## 다음 단계

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin 빌드
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델 제공자 Plugin 빌드
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/ko/plugins/cli-backend-plugins">
    로컬 AI CLI 백엔드 등록
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ko/plugins/sdk-overview">
    가져오기 맵 및 등록 API 참조
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime를 통한 TTS, 검색, 하위 에이전트
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ko/plugins/sdk-testing">
    테스트 유틸리티 및 패턴
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ko/plugins/manifest">
    전체 매니페스트 스키마 참조
  </Card>
</CardGroup>

## 관련 항목

- [Plugin 훅](/ko/plugins/hooks)
- [Plugin 아키텍처](/ko/plugins/architecture)
