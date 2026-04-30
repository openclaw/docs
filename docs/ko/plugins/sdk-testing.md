---
read_when:
    - Plugin 테스트를 작성하고 있습니다
    - Plugin SDK의 테스트 유틸리티가 필요합니다
    - 번들로 제공되는 Plugin의 계약 테스트를 이해하려는 경우
sidebarTitle: Testing
summary: OpenClaw Plugin을 위한 테스트 유틸리티 및 패턴
title: Plugin 테스트
x-i18n:
    generated_at: "2026-04-30T06:45:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin을 위한 테스트 유틸리티, 패턴, lint 적용에 대한 참조입니다.

<Tip>
  **테스트 예제를 찾고 있나요?** 하우투 가이드에는 완성된 테스트 예제가 포함되어 있습니다:
  [Channel Plugin 테스트](/ko/plugins/sdk-channel-plugins#step-6-test) 및
  [Provider Plugin 테스트](/ko/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## 테스트 유틸리티

**Plugin API 모의 객체 가져오기:** `openclaw/plugin-sdk/plugin-test-api`

**Agent 런타임 계약 가져오기:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Channel 계약 가져오기:** `openclaw/plugin-sdk/channel-contract-testing`

**Channel 테스트 헬퍼 가져오기:** `openclaw/plugin-sdk/channel-test-helpers`

**Channel 대상 테스트 가져오기:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin 계약 가져오기:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin 런타임 테스트 가져오기:** `openclaw/plugin-sdk/plugin-test-runtime`

**Provider 계약 가져오기:** `openclaw/plugin-sdk/provider-test-contracts`

**Provider HTTP 모의 객체 가져오기:** `openclaw/plugin-sdk/provider-http-test-mocks`

**환경/네트워크 테스트 가져오기:** `openclaw/plugin-sdk/test-env`

**일반 fixture 가져오기:** `openclaw/plugin-sdk/test-fixtures`

**Node 내장 모의 객체 가져오기:** `openclaw/plugin-sdk/test-node-mocks`

새 Plugin 테스트에는 아래의 집중된 하위 경로를 사용하는 것을 권장합니다. 넓은 범위의
`openclaw/plugin-sdk/testing` 배럴은 레거시 호환성 전용입니다.
리포지토리 가드레일은 `plugin-sdk/testing` 및
`plugin-sdk/test-utils`에서 새 실제 가져오기를 거부합니다. 이러한 이름은 외부 Plugin 및 호환성 기록 테스트를 위한 더 이상 권장되지 않는 호환성 표면으로만 남아 있습니다.

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

### 사용 가능한 내보내기

| 내보내기                                             | 목적                                                                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `createTestPluginApi`                                | 직접 등록 단위 테스트를 위한 최소 플러그인 API 모의 객체를 빌드합니다. `plugin-sdk/plugin-test-api`에서 가져옵니다                               |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 네이티브 에이전트 런타임 어댑터를 위한 공유 인증 프로필 계약 픽스처입니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다             |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 네이티브 에이전트 런타임 어댑터를 위한 공유 전달 억제 계약 픽스처입니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다               |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 네이티브 에이전트 런타임 어댑터를 위한 공유 폴백 분류 계약 픽스처입니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다               |
| `createParameterFreeTool`                            | 네이티브 런타임 계약 테스트를 위한 동적 도구 스키마 픽스처를 빌드합니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다               |
| `expectChannelInboundContextContract`                | 채널 인바운드 컨텍스트 형태를 검증합니다. `plugin-sdk/channel-contract-testing`에서 가져옵니다                                                   |
| `installChannelOutboundPayloadContractSuite`         | 채널 아웃바운드 페이로드 계약 사례를 설치합니다. `plugin-sdk/channel-contract-testing`에서 가져옵니다                                            |
| `createStartAccountContext`                          | 채널 계정 수명 주기 컨텍스트를 빌드합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                                      |
| `installChannelActionsContractSuite`                 | 일반 채널 메시지 동작 계약 사례를 설치합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                                   |
| `installChannelSetupContractSuite`                   | 일반 채널 설정 계약 사례를 설치합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                                          |
| `installChannelStatusContractSuite`                  | 일반 채널 상태 계약 사례를 설치합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                                          |
| `expectDirectoryIds`                                 | 디렉터리 목록 함수의 채널 디렉터리 ID를 검증합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                             |
| `assertBundledChannelEntries`                        | 번들된 채널 진입점이 예상 공개 계약을 노출하는지 검증합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                    |
| `formatEnvelopeTimestamp`                            | 결정적 엔벌로프 타임스탬프를 형식화합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                                      |
| `expectPairingReplyText`                             | 채널 페어링 응답 텍스트를 검증하고 코드를 추출합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                           |
| `describePluginRegistrationContract`                 | 플러그인 등록 계약 검사를 설치합니다. `plugin-sdk/plugin-test-contracts`에서 가져옵니다                                                          |
| `registerSingleProviderPlugin`                       | 로더 스모크 테스트에서 하나의 제공자 플러그인을 등록합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                      |
| `registerProviderPlugin`                             | 하나의 플러그인에서 모든 제공자 종류를 캡처합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                               |
| `registerProviderPlugins`                            | 여러 플러그인에 걸친 제공자 등록을 캡처합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                                   |
| `requireRegisteredProvider`                          | 제공자 컬렉션에 ID가 포함되어 있는지 검증합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                                 |
| `createRuntimeEnv`                                   | 모의 CLI/플러그인 런타임 환경을 빌드합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                                      |
| `createPluginSetupWizardStatus`                      | 채널 플러그인을 위한 설정 상태 헬퍼를 빌드합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                                |
| `describeOpenAIProviderRuntimeContract`              | 제공자 패밀리 런타임 계약 검사를 설치합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                                                 |
| `expectPassthroughReplayPolicy`                      | 제공자 재생 정책이 제공자 소유 도구와 메타데이터를 그대로 통과시키는지 검증합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다           |
| `runRealtimeSttLiveTest`                             | 공유 오디오 픽스처로 라이브 실시간 STT 제공자 테스트를 실행합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                           |
| `normalizeTranscriptForMatch`                        | 퍼지 검증 전에 라이브 transcript 출력을 정규화합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                                        |
| `expectExplicitVideoGenerationCapabilities`          | 비디오 제공자가 명시적 생성 모드 기능을 선언하는지 검증합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                               |
| `expectExplicitMusicGenerationCapabilities`          | 음악 제공자가 명시적 생성/편집 기능을 선언하는지 검증합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                                 |
| `mockSuccessfulDashscopeVideoTask`                   | 성공한 DashScope 호환 비디오 작업 응답을 설치합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                                         |
| `getProviderHttpMocks`                               | 옵트인 제공자 HTTP/인증 Vitest 모의 객체에 접근합니다. `plugin-sdk/provider-http-test-mocks`에서 가져옵니다                                      |
| `installProviderHttpMockCleanup`                     | 각 테스트 후 제공자 HTTP/인증 모의 객체를 재설정합니다. `plugin-sdk/provider-http-test-mocks`에서 가져옵니다                                     |
| `installCommonResolveTargetErrorCases`               | 대상 확인 오류 처리를 위한 공유 테스트 사례입니다. `plugin-sdk/channel-target-testing`에서 가져옵니다                                            |
| `shouldAckReaction`                                  | 채널이 확인 반응을 추가해야 하는지 확인합니다. `plugin-sdk/channel-feedback`에서 가져옵니다                                                     |
| `removeAckReactionAfterReply`                        | 응답 전달 후 확인 반응을 제거합니다. `plugin-sdk/channel-feedback`에서 가져옵니다                                                               |
| `createTestRegistry`                                 | 채널 플러그인 레지스트리 픽스처를 빌드합니다. `plugin-sdk/plugin-test-runtime` 또는 `plugin-sdk/channel-test-helpers`에서 가져옵니다             |
| `createEmptyPluginRegistry`                          | 빈 플러그인 레지스트리 픽스처를 빌드합니다. `plugin-sdk/plugin-test-runtime` 또는 `plugin-sdk/channel-test-helpers`에서 가져옵니다              |
| `setActivePluginRegistry`                            | 플러그인 런타임 테스트를 위한 레지스트리 픽스처를 설치합니다. `plugin-sdk/plugin-test-runtime` 또는 `plugin-sdk/channel-test-helpers`에서 가져옵니다 |
| `createRequestCaptureJsonFetch`                      | 미디어 헬퍼 테스트에서 JSON fetch 요청을 캡처합니다. `plugin-sdk/test-env`에서 가져옵니다                                                       |
| `withServer`                                         | 일회용 로컬 HTTP 서버를 대상으로 테스트를 실행합니다. `plugin-sdk/test-env`에서 가져옵니다                                                      |
| `createMockIncomingRequest`                          | 최소 인바운드 HTTP 요청 객체를 빌드합니다. `plugin-sdk/test-env`에서 가져옵니다                                                                 |
| `withFetchPreconnect`                                | 프리커넥트 훅이 설치된 상태로 fetch 테스트를 실행합니다. `plugin-sdk/test-env`에서 가져옵니다                                                   |
| `withEnv` / `withEnvAsync`                           | 환경 변수를 임시로 패치합니다. `plugin-sdk/test-env`에서 가져옵니다                                                                             |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 격리된 파일시스템 테스트 픽스처를 생성합니다. `plugin-sdk/test-env`에서 가져옵니다                                                              |
| `createMockServerResponse`                           | 최소 HTTP 서버 응답 모의 객체를 생성합니다. `plugin-sdk/test-env`에서 가져옵니다                                                                |
| `createCliRuntimeCapture`                            | 테스트에서 CLI 런타임 출력을 캡처합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                              |
| `importFreshModule`                                  | 모듈 캐시를 우회하기 위해 새로운 쿼리 토큰으로 ESM 모듈을 가져옵니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                 |
| `bundledPluginRoot` / `bundledPluginFile`            | 번들된 플러그인 소스 또는 dist 픽스처 경로를 확인합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                              |
| `mockNodeBuiltinModule`                              | 좁은 범위의 Node 내장 Vitest 모의 객체를 설치합니다. `plugin-sdk/test-node-mocks`에서 가져옵니다                                                |
| `createSandboxTestContext`                           | 샌드박스 테스트 컨텍스트를 빌드합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                                |
| `writeSkill`                                         | Skills 픽스처를 작성합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                                          |
| `makeAgentAssistantMessage`                          | 에이전트 transcript 메시지 픽스처를 빌드합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                      |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 시스템 이벤트 픽스처를 검사하고 재설정합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                        |
| `sanitizeTerminalText`                               | 검증을 위해 터미널 출력을 정리합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                                 |
| `countLines` / `hasBalancedFences`                   | 청크 출력 형태를 검증합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                                         |
| `runProviderCatalog`                                 | 테스트 의존성으로 제공자 카탈로그 훅을 실행합니다                                                                                              |
| `resolveProviderWizardOptions`                       | 계약 테스트에서 제공자 설정 마법사 선택지를 확인합니다                                                                                         |
| `resolveProviderModelPickerEntries`                  | 계약 테스트에서 제공자 모델 선택기 항목을 확인합니다                                                                                           |
| `buildProviderPluginMethodChoice`                    | 검증을 위한 제공자 마법사 선택 ID를 빌드합니다                                                                                                 |
| `setProviderWizardProvidersResolverForTest`          | 격리된 테스트를 위해 제공자 마법사 제공자를 주입합니다                                                                                         |
| `createProviderUsageFetch`                           | 프로바이더 사용량 가져오기 픽스처를 빌드합니다                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 시간에 민감한 테스트를 위해 타이머를 고정하고 복원합니다. `plugin-sdk/test-env`에서 가져옵니다                                                    |
| `createTestWizardPrompter`                           | 모의 설정 마법사 프롬프터를 빌드합니다                                                                                                     |
| `createRuntimeTaskFlow`                              | 격리된 런타임 TaskFlow 상태를 생성합니다                                                                                                  |
| `typedCases`                                         | 테이블 기반 테스트를 위해 리터럴 타입을 보존합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                    |

번들 Plugin 계약 스위트도 테스트 전용 레지스트리, 매니페스트, 공개 아티팩트 및 런타임 픽스처 헬퍼에 SDK 테스트 하위 경로를 사용합니다. 번들 OpenClaw 인벤토리에 의존하는 코어 전용 스위트는 `src/plugins/contracts` 아래에 유지합니다. 새 확장 테스트는 넓은 `plugin-sdk/testing` 호환성 배럴, 저장소 `src/**` 파일 또는 저장소 `test/helpers/*` 브리지를 직접 가져오는 대신 `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` 또는 `plugin-sdk/test-fixtures` 같은 문서화된 집중 SDK 하위 경로에 둡니다.

### 타입

집중 테스트 하위 경로는 테스트 파일에서 유용한 타입도 다시 내보냅니다.

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 테스트 대상 해석

채널 대상 해석에 대한 표준 오류 사례를 추가하려면 `installCommonResolveTargetErrorCases`를 사용합니다.

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Your channel's target resolution logic
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Add channel-specific test cases
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## 테스트 패턴

### 등록 계약 테스트

손으로 작성한 `api` 목을 `register(api)`에 전달하는 단위 테스트는 OpenClaw의 로더 허용 게이트를 실행하지 않습니다. Plugin이 의존하는 각 등록 표면, 특히 훅과 메모리 같은 독점 기능에 대해 로더 기반 스모크 테스트를 하나 이상 추가합니다.

필수 메타데이터가 없거나 Plugin이 소유하지 않은 기능 API를 호출하면 실제 로더는 Plugin 등록에 실패합니다. 예를 들어 `api.registerHook(...)`에는 훅 이름이 필요하고, `api.registerMemoryCapability(...)`에는 Plugin 매니페스트 또는 내보낸 엔트리가 `kind: "memory"`를 선언해야 합니다.

### 런타임 구성 접근 테스트

번들 채널 Plugin을 테스트할 때는 `openclaw/plugin-sdk/channel-test-helpers`의 공유 Plugin 런타임 목을 선호합니다. 이 목의 사용 중단된 `runtime.config.loadConfig()` 및 `runtime.config.writeConfigFile(...)` 목은 기본적으로 예외를 발생시키므로 테스트가 호환성 API의 새 사용을 잡아냅니다. 테스트가 레거시 호환성 동작을 명시적으로 다룰 때만 해당 목을 재정의합니다.

### 채널 Plugin 단위 테스트

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### 제공자 Plugin 단위 테스트

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Plugin 런타임 목 처리

`createPluginRuntimeStore`를 사용하는 코드의 경우 테스트에서 런타임을 목 처리합니다.

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// In test setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### 인스턴스별 스텁으로 테스트

프로토타입 변경보다 인스턴스별 스텁을 선호합니다.

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 계약 테스트(저장소 내 Plugin)

번들 Plugin에는 등록 소유권을 검증하는 계약 테스트가 있습니다.

```bash
pnpm test -- src/plugins/contracts/
```

이 테스트는 다음을 검증합니다.

- 어떤 Plugin이 어떤 제공자를 등록하는지
- 어떤 Plugin이 어떤 음성 제공자를 등록하는지
- 등록 형태의 정확성
- 런타임 계약 준수

### 범위 지정 테스트 실행

특정 Plugin의 경우:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

계약 테스트만 실행하는 경우:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## 린트 적용(저장소 내 Plugin)

저장소 내 Plugin에 대해 `pnpm check`가 세 가지 규칙을 적용합니다.

1. **단일 루트 가져오기 금지** -- `openclaw/plugin-sdk` 루트 배럴은 거부됩니다
2. **직접 `src/` 가져오기 금지** -- Plugin은 `../../src/`를 직접 가져올 수 없습니다
3. **자기 자신 가져오기 금지** -- Plugin은 자신의 `plugin-sdk/<name>` 하위 경로를 가져올 수 없습니다

외부 Plugin에는 이러한 린트 규칙이 적용되지 않지만, 동일한 패턴을 따르는 것이 좋습니다.

## 테스트 구성

OpenClaw는 V8 커버리지 임계값과 함께 Vitest를 사용합니다. Plugin 테스트의 경우:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

로컬 실행이 메모리 압박을 유발하는 경우:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 관련 항목

- [SDK 개요](/ko/plugins/sdk-overview) -- 가져오기 규칙
- [SDK 채널 Plugin](/ko/plugins/sdk-channel-plugins) -- 채널 Plugin 인터페이스
- [SDK 제공자 Plugin](/ko/plugins/sdk-provider-plugins) -- 제공자 Plugin 훅
- [Plugin 빌드](/ko/plugins/building-plugins) -- 시작하기 가이드
