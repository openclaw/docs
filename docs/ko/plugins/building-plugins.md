---
doc-schema-version: 1
read_when:
    - 새 OpenClaw Plugin을 생성하려고 합니다
    - Plugin 개발을 위한 빠른 시작 가이드가 필요합니다
    - 채널, 제공자, CLI 백엔드, 도구 또는 훅 문서 중에서 선택하고 있습니다.
sidebarTitle: Getting Started
summary: 몇 분 만에 첫 번째 OpenClaw Plugin을 만드십시오
title: Plugin 빌드하기
x-i18n:
    generated_at: "2026-07-16T12:49:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin을 사용하면 코어를 변경하지 않고 OpenClaw를 확장할 수 있습니다. Plugin은 메시징
채널, 모델 제공자, 로컬 CLI 백엔드, 에이전트 도구, 훅, 미디어 제공자
또는 Plugin이 소유한 다른 기능을 추가할 수 있습니다.

외부 Plugin을 OpenClaw 저장소에 추가할 필요는 없습니다. 패키지를
[ClawHub](/clawhub)에 게시하면 사용자는 다음 명령으로 설치할 수 있습니다.

```bash
openclaw plugins install clawhub:<package-name>
```

출시 전환 기간에는 접두사 없는 패키지 사양도 계속 npm에서 설치됩니다. ClawHub에서
해석하려면 `clawhub:` 접두사를 사용하십시오.

## 요구 사항

- Node 22.22.3+, Node 24.15+ 또는 Node 25.9+ 및 `npm` 또는 `pnpm`.
- TypeScript ESM 모듈.
- 저장소 내 번들 Plugin 작업의 경우 저장소를 복제하고 `pnpm install`을 실행하십시오.
  OpenClaw는 `extensions/*` 워크스페이스 패키지에서
  번들 Plugin을 검색하므로 소스 체크아웃 Plugin 개발에서는 pnpm만 사용할 수 있습니다.

## Plugin 형태 선택

<CardGroup cols={2}>
  <Card title="채널 Plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    OpenClaw를 메시징 플랫폼에 연결합니다.
  </Card>
  <Card title="제공자 Plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델, 미디어, 검색, 가져오기, 음성 또는 실시간 제공자를 추가합니다.
  </Card>
  <Card title="CLI 백엔드 Plugin" icon="terminal" href="/ko/plugins/cli-backend-plugins">
    OpenClaw 모델 폴백을 통해 로컬 AI CLI를 실행합니다.
  </Card>
  <Card title="도구 Plugin" icon="wrench" href="/ko/plugins/tool-plugins">
    에이전트 도구를 등록합니다.
  </Card>
</CardGroup>

## 빠른 시작

필수 에이전트 도구 하나를 등록하여 최소 도구 Plugin을 빌드합니다. 이는 가장
간결하면서도 유용한 Plugin 형태이며 패키지, 매니페스트, 진입점 및
로컬 검증을 다룹니다.

<Steps>
  <Step title="패키지 메타데이터 생성">
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
  "description": "OpenClaw에 사용자 지정 도구를 추가합니다",
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

    게시된 외부 Plugin은 런타임 진입점이 빌드된 JavaScript
    파일을 가리키도록 해야 합니다. 전체 진입점 계약은
    [SDK 진입점](/ko/plugins/sdk-entrypoints)을 참조하십시오.

    설정이 없어도 모든 Plugin에는 매니페스트가 필요합니다. OpenClaw가 모든 Plugin 런타임을
    즉시 로드하지 않고도 소유권을 검색할 수 있도록 런타임 도구가
    `contracts.tools`에 있어야 합니다. `activation.onStartup`을
    의도적으로 설정하십시오. 이 예제는 Gateway 시작 시 로드됩니다.

    호스트가 신뢰하는 Plugin 표면도 매니페스트로 제한되며, 설치된 Plugin에서는 명시적으로
    선언해야 합니다. `api.registerAgentToolResultMiddleware(...)`에는
    `contracts.agentToolResultMiddleware`에 나열된 각 대상 런타임이 필요하고,
    `api.registerTrustedToolPolicy(...)`에는 `contracts.trustedToolPolicies`의
    각 정책 ID가 필요합니다. 이러한 선언을 통해 설치 시 검사와 런타임 등록이
    일치하도록 유지합니다.

    모든 매니페스트 필드는 [Plugin 매니페스트](/ko/plugins/manifest)를 참조하십시오.

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

    채널이 아닌 Plugin에는 `definePluginEntry`을 사용하십시오. 채널 Plugin은 대신
    `openclaw/plugin-sdk/core`의 `defineChannelPluginEntry`을 사용합니다.

  </Step>

  <Step title="런타임 테스트">
    설치된 Plugin 또는 외부 Plugin의 경우 로드된 런타임을 검사합니다.

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin이 CLI 명령을 등록하는 경우 해당 명령도 실행하고 출력을 확인하십시오.
    예: `openclaw demo-plugin ping`.

    이 저장소의 번들 Plugin인 경우 OpenClaw는 `extensions/*` 워크스페이스에서
    소스 체크아웃 Plugin 패키지를 검색합니다. 가장 가까운 범위의 테스트를
    실행하십시오.

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="패키지 설치 테스트">
    게시하기 전에 패키지로 준비된 Plugin을 사용자가 받게 될 것과 동일한 설치 형태로
    테스트하십시오. 먼저 빌드 단계를 추가하고 `openclaw.extensions`과 같은 런타임 진입점이
    `./dist/index.js` 같은 빌드된 JavaScript를 가리키도록 한 다음,
    `npm pack`에 해당 `dist/` 출력이 포함되는지 확인하십시오. TypeScript 소스 진입점은
    소스 체크아웃과 로컬 개발 경로에서만 사용합니다.

    그런 다음 Plugin을 패키징하고 `npm-pack:`을 사용하여 tarball을 설치하십시오.

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:`은 OpenClaw가 관리하는 Plugin별 npm 프로젝트를 사용하므로
    소스 체크아웃 테스트에서 숨겨질 수 있는 런타임 종속성 오류를 발견합니다. 이는
    패키지와 종속성 형태를 검증하지만 카탈로그에 연결된 공식 신뢰를 검증하지는 않습니다.
    런타임 가져오기는 `dependencies` 또는 `optionalDependencies`에 있어야 합니다.
    `devDependencies`에만 남아 있는 종속성은 관리형 런타임 프로젝트에
    설치되지 않습니다.

    공식 또는 권한 있는 Plugin 동작의 최종 검증으로 원시 아카이브/경로 설치를 사용하지 마십시오. 원시 소스는 로컬 디버깅에는 유용하지만 npm 또는 ClawHub 설치와 동일한 종속성 경로를 검증하지는 않습니다. Plugin이 신뢰할 수 있는 공식 Plugin 상태에 의존하는 경우, 공식 신뢰를 기록하는 카탈로그 기반 공식 설치 또는 게시된 패키지 경로를 통한 두 번째 검증을 추가하십시오. 설치 루트 및 종속성 소유권에 대한 자세한 내용은 [Plugin 종속성 확인](/ko/plugins/dependency-resolution)을 참조하십시오.

  </Step>

  <Step title="게시">
    게시하기 전에 패키지를 검증하십시오.

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    표준 ClawHub 패키지 스니펫은 `docs/snippets/plugin-publish/`에 있습니다.

  </Step>

  <Step title="설치">
    게시된 패키지를 ClawHub를 통해 설치하십시오.

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## 도구 등록

도구는 필수 또는 선택 사항일 수 있습니다. 필수 도구는 Plugin이 활성화되면 항상 사용할 수 있습니다. 선택적 도구는 OpenClaw가 해당 도구를 소유한 Plugin 런타임을 로드하기 전에 사용자가 명시적으로 동의해야 합니다.

도구 팩터리는 신뢰할 수 있는 런타임 컨텍스트를 받으며, 여기에는 `deliveryContext`, 사용 가능한 경우 활성 플랫폼 대화를 위한 `nativeChannelId`, 그리고 `requesterSenderId`이 포함됩니다.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "워크플로 실행",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

`api.registerTool(...)`로 등록된 모든 도구는 Plugin 매니페스트에도 선언해야 합니다.

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

사용자는 `tools.allow`을 사용하여 동의합니다.

```json5
{
  tools: { allow: ["workflow_tool"] }, // 또는 한 Plugin의 모든 도구에는 ["my-plugin"]
}
```

선택적 도구는 도구를 모델에 노출할지 여부를 제어합니다. 모델이 도구나 훅을 선택한 후 작업이 실행되기 전에 승인을 요청해야 하는 경우 [Plugin 권한 요청](/ko/plugins/plugin-permission-requests)을 사용하십시오.

부작용이 있거나, 일반적이지 않은 바이너리가 필요하거나, 기본적으로 노출해서는 안 되는 기능에는 선택적 도구를 사용하십시오. 도구 이름은 핵심 도구 이름과 충돌해서는 안 됩니다. 충돌하는 등록은 건너뛰고 Plugin 진단에 보고됩니다. 잘못된 형식의 등록도 같은 방식으로 건너뛰고 보고됩니다. 여기에는 비어 있지 않은 `name`의 누락, 함수가 아닌 `execute`, 또는 `parameters` 객체가 없는 도구 설명자가 포함됩니다.

도구 팩터리는 런타임에서 제공하는 컨텍스트 객체를 받습니다. 도구가 현재 턴의 활성 모델에 맞춰 로깅, 표시 또는 동작을 조정해야 하는 경우 `ctx.activeModel`을 사용하십시오. 여기에는 `provider`, `modelId`, `modelRef`이 포함될 수 있습니다. 이를 로컬 운영자, 설치된 Plugin 코드 또는 수정된 OpenClaw 런타임에 대한 보안 경계가 아니라 정보 제공용 런타임 메타데이터로 취급하십시오. 민감한 로컬 도구는 여전히 명시적인 Plugin 또는 운영자 동의를 요구해야 하며, 활성 모델 메타데이터가 없거나 적합하지 않으면 안전하게 실패해야 합니다.

매니페스트는 소유권과 검색을 선언하지만, 실행 시에는 여전히 등록된 실제 도구 구현을 호출합니다. OpenClaw가 도구가 명시적으로 허용 목록에 추가될 때까지 해당 Plugin 런타임을 로드하지 않을 수 있도록 `toolMetadata.<tool>.optional: true`을 `api.registerTool(..., { optional: true })`과 일치하게 유지하십시오.

## 가져오기 규칙

세분화된 SDK 하위 경로에서 가져오십시오.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

사용 중단된 루트 배럴에서 가져오지 마십시오.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Plugin 패키지 내에서는 내부 가져오기에 `api.ts` 및 `runtime-api.ts` 같은 로컬 배럴 파일을 사용하십시오. SDK 경로를 통해 자체 Plugin을 가져오지 마십시오. 프로바이더별 헬퍼는 경계가 실제로 일반적인 경우가 아니라면 프로바이더 패키지에 유지해야 합니다.

사용자 지정 Gateway RPC 메서드는 고급 진입점입니다. Plugin별 접두사를 사용하십시오. `config.*`, `exec.approvals.*`, `operator.admin.*`, `wizard.*`, `update.*` 같은 핵심 관리 네임스페이스는 예약된 상태로 유지되며 `operator.admin`로 확인됩니다. `openclaw/plugin-sdk/gateway-method-runtime` 브리지는 `contracts.gatewayMethodDispatch: ["authenticated-request"]`을 선언하는 Plugin HTTP 라우트용으로 예약되어 있습니다.

전체 가져오기 맵은 [Plugin SDK 개요](/ko/plugins/sdk-overview)를 참조하십시오.

## 제출 전 체크리스트

<Check>**package.json**에 올바른 `openclaw` 메타데이터가 있습니다</Check>
<Check>**openclaw.plugin.json** 매니페스트가 존재하며 유효합니다</Check>
<Check>진입점에서 `defineChannelPluginEntry` 또는 `definePluginEntry`을 사용합니다</Check>
<Check>모든 가져오기에 세분화된 `plugin-sdk/<subpath>` 경로를 사용합니다</Check>
<Check>내부 가져오기에 SDK 자체 가져오기가 아닌 로컬 모듈을 사용합니다</Check>
<Check>테스트가 통과합니다(`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check`이 통과합니다(저장소 내 Plugin)</Check>

## 베타 릴리스에 대한 테스트

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 릴리스(`Watch` > `Releases`)를 확인하십시오. 베타 태그는 `v2026.3.N-beta.1`과 같은 형식입니다. X에서 [@openclaw](https://x.com/openclaw)를 팔로우하여 릴리스 공지를 확인할 수도 있습니다.
2. 베타 태그가 표시되는 즉시 Plugin을 테스트하십시오. 안정 버전 출시 전까지의 기간은 일반적으로 몇 시간에 불과합니다.
3. 테스트 후 `plugin-forum` Discord 채널([discord.gg/clawd](https://discord.gg/clawd))의 Plugin 스레드에 `all good` 또는 발생한 문제를 게시하십시오. 아직 스레드가 없다면 생성하십시오.
4. 문제가 발생하면 제목이 `Beta blocker: <plugin-name> - <summary>`인 이슈를 새로 열거나 업데이트하고 `beta-blocker` 레이블을 적용하십시오. 스레드에 이슈 링크를 추가하십시오.
5. 제목이 `fix(<plugin-id>): beta blocker - <summary>`인 PR을 `main`에 열고 PR과 Discord 스레드 양쪽에 이슈 링크를 추가하십시오. 기여자는 PR에 레이블을 지정할 수 없으므로 제목이 유지관리자와 자동화에 보내는 PR 측 신호 역할을 합니다. PR이 있는 차단 문제는 병합되지만, PR이 없는 차단 문제는 그대로 릴리스될 수도 있습니다.
6. 아무 소식이 없으면 문제없다는 의미입니다. 이 기간을 놓치면 일반적으로 수정 사항은 다음 주기에 반영됩니다.

## 다음 단계

<CardGroup cols={2}>
  <Card title="채널 Plugin" icon="messages-square" href="/ko/plugins/sdk-channel-plugins">
    메시징 채널 Plugin 구축
  </Card>
  <Card title="제공자 Plugin" icon="cpu" href="/ko/plugins/sdk-provider-plugins">
    모델 제공자 Plugin 구축
  </Card>
  <Card title="CLI 백엔드 Plugin" icon="terminal" href="/ko/plugins/cli-backend-plugins">
    로컬 AI CLI 백엔드 등록
  </Card>
  <Card title="SDK 개요" icon="book-open" href="/ko/plugins/sdk-overview">
    임포트 맵 및 등록 API 참조
  </Card>
  <Card title="런타임 도우미" icon="settings" href="/ko/plugins/sdk-runtime">
    api.runtime을 통한 TTS, 검색, 하위 에이전트
  </Card>
  <Card title="테스트" icon="test-tubes" href="/ko/plugins/sdk-testing">
    테스트 유틸리티 및 패턴
  </Card>
  <Card title="Plugin 매니페스트" icon="file-json" href="/ko/plugins/manifest">
    전체 매니페스트 스키마 참조
  </Card>
</CardGroup>

## 관련 항목

- [Plugin 훅](/ko/plugins/hooks)
- [Plugin 아키텍처](/ko/plugins/architecture)
