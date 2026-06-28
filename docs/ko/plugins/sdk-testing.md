---
read_when:
    - Plugin에 대한 테스트를 작성하고 있습니다
    - Plugin SDK의 테스트 유틸리티가 필요합니다
    - 번들된 Plugin의 계약 테스트를 이해하고자 합니다
sidebarTitle: Testing
summary: OpenClaw Plugin을 위한 테스트 유틸리티 및 패턴
title: Plugin 테스트
x-i18n:
    generated_at: "2026-06-28T07:42:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin의 테스트 유틸리티, 패턴 및 린트 적용에 대한 참조입니다.

<Tip>
  **테스트 예시를 찾고 있나요?** 방법 가이드에는 실제 테스트 예시가 포함되어 있습니다:
  [채널 Plugin 테스트](/ko/plugins/sdk-channel-plugins#step-6-test) 및
  [Provider Plugin 테스트](/ko/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## 테스트 유틸리티

이 테스트 헬퍼 하위 경로는 OpenClaw 자체 번들 Plugin 테스트를 위한 저장소 로컬 소스 진입점입니다. 서드파티 Plugin용 패키지 내보내기가 아니며, Vitest 또는 기타 저장소 전용 테스트 의존성을 가져올 수 있습니다.

**Plugin API 모의 가져오기:** `openclaw/plugin-sdk/plugin-test-api`

**Agent 런타임 계약 가져오기:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**채널 계약 가져오기:** `openclaw/plugin-sdk/channel-contract-testing`

**채널 테스트 헬퍼 가져오기:** `openclaw/plugin-sdk/channel-test-helpers`

**채널 대상 테스트 가져오기:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin 계약 가져오기:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin 런타임 테스트 가져오기:** `openclaw/plugin-sdk/plugin-test-runtime`

**Provider 계약 가져오기:** `openclaw/plugin-sdk/provider-test-contracts`

**Provider HTTP 모의 가져오기:** `openclaw/plugin-sdk/provider-http-test-mocks`

**환경/네트워크 테스트 가져오기:** `openclaw/plugin-sdk/test-env`

**범용 픽스처 가져오기:** `openclaw/plugin-sdk/test-fixtures`

**Node 내장 모의 가져오기:** `openclaw/plugin-sdk/test-node-mocks`

OpenClaw 저장소 내부에서는 새 번들 Plugin 테스트에 아래의 집중된 하위 경로를 선호하세요. 범용 `openclaw/plugin-sdk/testing` 배럴은 레거시 호환성 전용입니다.
저장소 가드레일은 `plugin-sdk/testing` 및 `plugin-sdk/test-utils`에서 새 실제 가져오기를 거부합니다. 해당 이름은 호환성 기록 테스트를 위한 사용 중단된 호환성 표면으로만 남아 있습니다.

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

| 내보내기                                             | 목적                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 직접 등록 단위 테스트를 위한 최소 Plugin API 모의를 빌드합니다. `plugin-sdk/plugin-test-api`에서 가져옵니다                              |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 네이티브 에이전트 런타임 어댑터를 위한 공유 인증 프로필 계약 픽스처입니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다      |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 네이티브 에이전트 런타임 어댑터를 위한 공유 전달 억제 계약 픽스처입니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다        |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 네이티브 에이전트 런타임 어댑터를 위한 공유 대체 분류 계약 픽스처입니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다        |
| `createParameterFreeTool`                            | 네이티브 런타임 계약 테스트를 위한 동적 도구 스키마 픽스처를 빌드합니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다        |
| `expectChannelInboundContextContract`                | 채널 인바운드 컨텍스트 형태를 검증합니다. `plugin-sdk/channel-contract-testing`에서 가져옵니다                                           |
| `installChannelOutboundPayloadContractSuite`         | 채널 아웃바운드 페이로드 계약 케이스를 설치합니다. `plugin-sdk/channel-contract-testing`에서 가져옵니다                                  |
| `createStartAccountContext`                          | 채널 계정 수명 주기 컨텍스트를 빌드합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                              |
| `installChannelActionsContractSuite`                 | 일반 채널 메시지 작업 계약 케이스를 설치합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                         |
| `installChannelSetupContractSuite`                   | 일반 채널 설정 계약 케이스를 설치합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                                |
| `installChannelStatusContractSuite`                  | 일반 채널 상태 계약 케이스를 설치합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                                |
| `expectDirectoryIds`                                 | 디렉터리 목록 함수의 채널 디렉터리 ID를 검증합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                     |
| `assertBundledChannelEntries`                        | 번들 채널 엔트리포인트가 예상 공개 계약을 노출하는지 검증합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                        |
| `formatEnvelopeTimestamp`                            | 결정적 엔벌로프 타임스탬프를 형식화합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                                              |
| `expectPairingReplyText`                             | 채널 페어링 응답 텍스트를 검증하고 해당 코드를 추출합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다                              |
| `describePluginRegistrationContract`                 | Plugin 등록 계약 검사를 설치합니다. `plugin-sdk/plugin-test-contracts`에서 가져옵니다                                                    |
| `registerSingleProviderPlugin`                       | 로더 스모크 테스트에서 하나의 제공자 Plugin을 등록합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                |
| `registerProviderPlugin`                             | 하나의 Plugin에서 모든 제공자 종류를 캡처합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                         |
| `registerProviderPlugins`                            | 여러 Plugin에 걸친 제공자 등록을 캡처합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                             |
| `requireRegisteredProvider`                          | 제공자 컬렉션에 ID가 포함되어 있는지 검증합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                         |
| `createRuntimeEnv`                                   | 모의 처리된 CLI/Plugin 런타임 환경을 빌드합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                         |
| `createPluginRuntimeMock`                            | 모의 처리된 Plugin 런타임 표면을 빌드합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                             |
| `createPluginSetupWizardStatus`                      | 채널 Plugin을 위한 설정 상태 헬퍼를 빌드합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다                                          |
| `describeOpenAIProviderRuntimeContract`              | 제공자 계열 런타임 계약 검사를 설치합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                                           |
| `expectPassthroughReplayPolicy`                      | 제공자 재생 정책이 제공자 소유 도구와 메타데이터를 그대로 전달하는지 검증합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다     |
| `runRealtimeSttLiveTest`                             | 공유 오디오 픽스처로 실시간 STT 제공자 라이브 테스트를 실행합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                   |
| `normalizeTranscriptForMatch`                        | 퍼지 검증 전에 라이브 전사 출력을 정규화합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                                      |
| `expectExplicitVideoGenerationCapabilities`          | 비디오 제공자가 명시적 생성 모드 기능을 선언하는지 검증합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                       |
| `expectExplicitMusicGenerationCapabilities`          | 음악 제공자가 명시적 생성/편집 기능을 선언하는지 검증합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                         |
| `mockSuccessfulDashscopeVideoTask`                   | 성공한 DashScope 호환 비디오 작업 응답을 설치합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다                                 |
| `getProviderHttpMocks`                               | 옵트인 제공자 HTTP/인증 Vitest 모의에 접근합니다. `plugin-sdk/provider-http-test-mocks`에서 가져옵니다                                   |
| `installProviderHttpMockCleanup`                     | 각 테스트 후 제공자 HTTP/인증 모의를 초기화합니다. `plugin-sdk/provider-http-test-mocks`에서 가져옵니다                                  |
| `installCommonResolveTargetErrorCases`               | 대상 확인 오류 처리를 위한 공유 테스트 케이스입니다. `plugin-sdk/channel-target-testing`에서 가져옵니다                                  |
| `shouldAckReaction`                                  | 채널이 확인 리액션을 추가해야 하는지 확인합니다. `plugin-sdk/channel-feedback`에서 가져옵니다                                            |
| `removeAckReactionAfterReply`                        | 응답 전달 후 확인 리액션을 제거합니다. `plugin-sdk/channel-feedback`에서 가져옵니다                                                      |
| `createTestRegistry`                                 | 채널 Plugin 레지스트리 픽스처를 빌드합니다. `plugin-sdk/plugin-test-runtime` 또는 `plugin-sdk/channel-test-helpers`에서 가져옵니다        |
| `createEmptyPluginRegistry`                          | 빈 Plugin 레지스트리 픽스처를 빌드합니다. `plugin-sdk/plugin-test-runtime` 또는 `plugin-sdk/channel-test-helpers`에서 가져옵니다          |
| `setActivePluginRegistry`                            | Plugin 런타임 테스트를 위한 레지스트리 픽스처를 설치합니다. `plugin-sdk/plugin-test-runtime` 또는 `plugin-sdk/channel-test-helpers`에서 가져옵니다 |
| `createRequestCaptureJsonFetch`                      | 미디어 헬퍼 테스트에서 JSON fetch 요청을 캡처합니다. `plugin-sdk/test-env`에서 가져옵니다                                                |
| `withServer`                                         | 폐기 가능한 로컬 HTTP 서버를 대상으로 테스트를 실행합니다. `plugin-sdk/test-env`에서 가져옵니다                                          |
| `createMockIncomingRequest`                          | 최소 인바운드 HTTP 요청 객체를 빌드합니다. `plugin-sdk/test-env`에서 가져옵니다                                                          |
| `withFetchPreconnect`                                | 프리커넥트 훅이 설치된 상태로 fetch 테스트를 실행합니다. `plugin-sdk/test-env`에서 가져옵니다                                            |
| `withEnv` / `withEnvAsync`                           | 환경 변수를 임시로 패치합니다. `plugin-sdk/test-env`에서 가져옵니다                                                                      |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 격리된 파일 시스템 테스트 픽스처를 생성합니다. `plugin-sdk/test-env`에서 가져옵니다                                                     |
| `createMockServerResponse`                           | 최소 HTTP 서버 응답 모의를 생성합니다. `plugin-sdk/test-env`에서 가져옵니다                                                              |
| `createCliRuntimeCapture`                            | 테스트에서 CLI 런타임 출력을 캡처합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                       |
| `importFreshModule`                                  | 모듈 캐시를 우회하기 위해 새로운 쿼리 토큰으로 ESM 모듈을 가져옵니다. `plugin-sdk/test-fixtures`에서 가져옵니다                          |
| `bundledPluginRoot` / `bundledPluginFile`            | 번들 Plugin 소스 또는 dist 픽스처 경로를 확인합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                           |
| `mockNodeBuiltinModule`                              | 좁은 Node 내장 Vitest 모의를 설치합니다. `plugin-sdk/test-node-mocks`에서 가져옵니다                                                     |
| `createSandboxTestContext`                           | 샌드박스 테스트 컨텍스트를 빌드합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                         |
| `writeSkill`                                         | Skills 픽스처를 작성합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                                    |
| `makeAgentAssistantMessage`                          | 에이전트 전사 메시지 픽스처를 빌드합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                      |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 시스템 이벤트 픽스처를 검사하고 초기화합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                  |
| `sanitizeTerminalText`                               | 검증을 위해 터미널 출력을 정리합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                          |
| `countLines` / `hasBalancedFences`                   | 청크 처리 출력 형태를 검증합니다. `plugin-sdk/test-fixtures`에서 가져옵니다                                                              |
| `runProviderCatalog`                                 | 테스트 의존성을 사용해 제공자 카탈로그 훅을 실행합니다                                                                                  |
| `resolveProviderWizardOptions`                       | 계약 테스트에서 제공자 설정 마법사 선택 항목을 확인합니다                                                                               |
| `resolveProviderModelPickerEntries`                  | 계약 테스트에서 제공자 모델 선택기 항목을 확인합니다                                                                                    |
| `buildProviderPluginMethodChoice`                    | 검증을 위한 제공자 마법사 선택 ID를 빌드합니다                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | 격리된 테스트를 위해 공급자 마법사 공급자 주입                                                                                      |
| `createProviderUsageFetch`                           | 공급자 사용량 fetch 픽스처 빌드                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 시간에 민감한 테스트를 위해 타이머를 정지하고 복원합니다. `plugin-sdk/test-env`에서 가져오기                                                    |
| `createTestWizardPrompter`                           | 모의 설정 마법사 프롬프터 빌드                                                                                                     |
| `createRuntimeTaskFlow`                              | 격리된 런타임 task-flow 상태 생성                                                                                                  |
| `typedCases`                                         | 테이블 기반 테스트를 위해 리터럴 타입을 보존합니다. `plugin-sdk/test-fixtures`에서 가져오기                                                    |

번들 Plugin 계약 스위트도 테스트 전용 registry, manifest, public-artifact,
runtime fixture 헬퍼에 SDK 테스트 하위 경로를 사용합니다. 번들 OpenClaw
인벤토리에 의존하는 core-only 스위트는 `src/plugins/contracts` 아래에 둡니다.
새 확장 테스트는 광범위한 `plugin-sdk/testing` 호환성 배럴, 리포지토리
`src/**` 파일, 또는 리포지토리 `test/helpers/*` 브리지를 직접 가져오는 대신,
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env`, `plugin-sdk/test-fixtures` 같은 문서화된 집중형 SDK
하위 경로에 둡니다.

### 타입

집중형 테스트 하위 경로는 테스트 파일에서 유용한 타입도 다시 내보냅니다.

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 테스트 대상 해석

채널 대상 해석을 위한 표준 오류 사례를 추가하려면
`installCommonResolveTargetErrorCases`를 사용합니다.

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

직접 작성한 `api` mock을 `register(api)`에 전달하는 단위 테스트는
OpenClaw의 로더 수락 게이트를 실행하지 않습니다. Plugin이 의존하는 각 등록
표면, 특히 hook과 memory 같은 독점 capability마다 최소 하나의 로더 기반
스모크 테스트를 추가합니다.

필수 metadata가 누락되었거나 Plugin이 자신이 소유하지 않은 capability API를
호출하면 실제 로더는 Plugin 등록에 실패합니다. 예를 들어
`api.registerHook(...)`에는 hook 이름이 필요하고,
`api.registerMemoryCapability(...)`에는 Plugin manifest 또는 내보낸 entry가
`kind: "memory"`를 선언해야 합니다.

### 런타임 설정 접근 테스트

`openclaw/plugin-sdk/plugin-test-runtime`의 공유 Plugin runtime mock을
선호합니다. 사용 중단된 `runtime.config.loadConfig()` 및
`runtime.config.writeConfigFile(...)` mock은 기본적으로 예외를 던지므로,
테스트가 호환성 API의 새 사용을 잡아냅니다. 테스트가 명시적으로 레거시
호환성 동작을 다루는 경우에만 해당 mock을 재정의합니다.

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

### provider Plugin 단위 테스트

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

### Plugin runtime mock 처리

`createPluginRuntimeStore`를 사용하는 코드에서는 테스트에서 runtime을 mock 처리합니다.

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

### 인스턴스별 stub으로 테스트

프로토타입 변경보다 인스턴스별 stub을 선호합니다.

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 계약 테스트(리포지토리 내 Plugin)

번들 Plugin에는 등록 소유권을 검증하는 계약 테스트가 있습니다.

```bash
pnpm test -- src/plugins/contracts/
```

이 테스트는 다음을 검증합니다.

- 어떤 Plugin이 어떤 provider를 등록하는지
- 어떤 Plugin이 어떤 speech provider를 등록하는지
- 등록 형태의 정확성
- runtime 계약 준수

### 범위 지정 테스트 실행

특정 Plugin의 경우:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

계약 테스트만 실행하는 경우:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## 린트 적용(리포지토리 내 Plugin)

리포지토리 내 Plugin에는 `pnpm check`로 세 가지 규칙이 적용됩니다.

1. **모놀리식 루트 import 금지** -- `openclaw/plugin-sdk` 루트 배럴은 거부됩니다
2. **직접 `src/` import 금지** -- Plugin은 `../../src/`를 직접 import할 수 없습니다
3. **자기 자신 import 금지** -- Plugin은 자체 `plugin-sdk/<name>` 하위 경로를 import할 수 없습니다

외부 Plugin에는 이러한 린트 규칙이 적용되지 않지만, 동일한 패턴을 따르는 것이
권장됩니다.

## 테스트 설정

OpenClaw는 V8 coverage 임계값과 함께 Vitest를 사용합니다. Plugin 테스트의 경우:

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

로컬 실행에서 메모리 압박이 발생하는 경우:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 관련 항목

- [SDK 개요](/ko/plugins/sdk-overview) -- import 규칙
- [SDK 채널 Plugin](/ko/plugins/sdk-channel-plugins) -- 채널 Plugin 인터페이스
- [SDK provider Plugin](/ko/plugins/sdk-provider-plugins) -- provider Plugin hook
- [Plugin 빌드](/ko/plugins/building-plugins) -- 시작 가이드
