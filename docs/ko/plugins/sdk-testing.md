---
read_when:
    - Plugin 테스트를 작성하고 있습니다
    - Plugin SDK의 테스트 유틸리티가 필요합니다
    - 번들 Plugin의 계약 테스트를 이해하려고 합니다
sidebarTitle: Testing
summary: OpenClaw Plugin을 위한 테스트 유틸리티 및 패턴
title: Plugin 테스트
x-i18n:
    generated_at: "2026-07-12T15:32:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw Plugin의 테스트 유틸리티, 패턴 및 린트 적용에 관한 참고 자료입니다.

<Tip>
  **테스트 예시를 찾고 계십니까?** 방법 가이드에는 실제 테스트 예시가 포함되어 있습니다.
  [채널 Plugin 테스트](/ko/plugins/sdk-channel-plugins#step-6-test) 및
  [제공자 Plugin 테스트](/ko/plugins/sdk-provider-plugins#step-6-test)를 참조하십시오.
</Tip>

## 테스트 유틸리티

다음 하위 경로는 OpenClaw 자체 번들 Plugin 테스트를 위한 저장소 로컬 소스 진입점입니다.
서드 파티 Plugin에 게시되는 `package.json` 내보내기가 아니며, Vitest 또는 저장소에서만
사용하는 다른 테스트 종속성을 가져올 수 있습니다.

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

새 번들 Plugin 테스트에는 이러한 용도별 하위 경로를 우선 사용하십시오. 광범위한
`openclaw/plugin-sdk/testing` 배럴과 `openclaw/plugin-sdk/test-utils` 별칭은
레거시 호환성 전용입니다. `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`)는 확장 기능 테스트 파일에서
두 경로 중 하나를 새로 가져오는 것을 거부하며, 두 경로 모두 호환성 기록 테스트만을
위해 유지됩니다.

### 사용 가능한 내보내기

| 내보내기                                             | 용도                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 직접 등록 단위 테스트를 위한 최소 Plugin API 모의를 구성합니다. `plugin-sdk/plugin-test-api`에서 가져옵니다.                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 네이티브 에이전트 런타임 어댑터용 공유 인증 프로필 계약 픽스처입니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다.            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 네이티브 에이전트 런타임 어댑터용 공유 전송 억제 계약 픽스처입니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다.              |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 네이티브 에이전트 런타임 어댑터용 공유 폴백 분류 계약 픽스처입니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다.              |
| `createParameterFreeTool`                            | 네이티브 런타임 계약 테스트용 동적 도구 스키마 픽스처를 구성합니다. `plugin-sdk/agent-runtime-test-contracts`에서 가져옵니다.             |
| `expectChannelInboundContextContract`                | 채널 인바운드 컨텍스트 형태를 검증합니다. `plugin-sdk/channel-contract-testing`에서 가져옵니다.                                          |
| `installChannelOutboundPayloadContractSuite`         | 채널 아웃바운드 페이로드 계약 사례를 설치합니다. `plugin-sdk/channel-contract-testing`에서 가져옵니다.                                   |
| `createStartAccountContext`                          | 채널 계정 수명 주기 컨텍스트를 구성합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다.                                             |
| `installChannelActionsContractSuite`                 | 일반 채널 메시지 작업 계약 사례를 설치합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다.                                         |
| `installChannelSetupContractSuite`                   | 일반 채널 설정 계약 사례를 설치합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다.                                                |
| `installChannelStatusContractSuite`                  | 일반 채널 상태 계약 사례를 설치합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다.                                                |
| `expectDirectoryIds`                                 | 디렉터리 목록 함수의 채널 디렉터리 ID를 검증합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다.                                    |
| `assertBundledChannelEntries`                        | 번들 채널 진입점이 예상되는 공개 계약을 노출하는지 검증합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다.                          |
| `formatEnvelopeTimestamp`                            | 결정론적 봉투 타임스탬프의 형식을 지정합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다.                                         |
| `expectPairingReplyText`                             | 채널 페어링 응답 텍스트를 검증하고 해당 코드를 추출합니다. `plugin-sdk/channel-test-helpers`에서 가져옵니다.                             |
| `describePluginRegistrationContract`                 | Plugin 등록 계약 검사를 설치합니다. `plugin-sdk/plugin-test-contracts`에서 가져옵니다.                                                  |
| `registerSingleProviderPlugin`                       | 로더 스모크 테스트에서 하나의 제공자 Plugin을 등록합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                               |
| `registerProviderPlugin`                             | 하나의 Plugin에서 모든 제공자 종류를 캡처합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                                       |
| `registerProviderPlugins`                            | 여러 Plugin의 제공자 등록을 캡처합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                                                |
| `requireRegisteredProvider`                          | 제공자 컬렉션에 ID가 포함되어 있는지 검증합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                                       |
| `createRuntimeEnv`                                   | 모의 CLI/Plugin 런타임 환경을 구성합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                                              |
| `createPluginRuntimeMock`                            | 모의 Plugin 런타임 표면을 구성합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                                                  |
| `createPluginSetupWizardStatus`                      | 채널 Plugin용 설정 상태 도우미를 구성합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                                           |
| `createTestWizardPrompter`                           | 모의 설정 마법사 프롬프터를 구성합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                                                |
| `createRuntimeTaskFlow`                              | 격리된 런타임 TaskFlow 상태를 생성합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                                              |
| `runProviderCatalog`                                 | 테스트 종속성을 사용하여 제공자 카탈로그 훅을 실행합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                              |
| `resolveProviderWizardOptions`                       | 계약 테스트에서 제공자 설정 마법사 선택지를 확인합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                               |
| `resolveProviderModelPickerEntries`                  | 계약 테스트에서 제공자 모델 선택기 항목을 확인합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                                 |
| `buildProviderPluginMethodChoice`                    | 검증용 제공자 마법사 선택 ID를 구성합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                                             |
| `setProviderWizardProvidersResolverForTest`          | 격리된 테스트를 위해 제공자 마법사의 제공자를 주입합니다. `plugin-sdk/plugin-test-runtime`에서 가져옵니다.                              |
| `describeOpenAIProviderRuntimeContract`              | 제공자 계열 런타임 계약 검사를 설치합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다.                                        |
| `expectPassthroughReplayPolicy`                      | 제공자 재생 정책이 제공자 소유 도구와 메타데이터를 그대로 통과시키는지 검증합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다. |
| `runRealtimeSttLiveTest`                             | 공유 오디오 픽스처를 사용하여 실시간 STT 제공자 라이브 테스트를 실행합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다.        |
| `normalizeTranscriptForMatch`                        | 퍼지 검증 전에 라이브 트랜스크립트 출력을 정규화합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다.                            |
| `expectExplicitVideoGenerationCapabilities`          | 비디오 제공자가 명시적인 생성 모드 기능을 선언하는지 검증합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다.                    |
| `expectExplicitMusicGenerationCapabilities`          | 음악 제공자가 명시적인 생성/편집 기능을 선언하는지 검증합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다.                      |
| `mockSuccessfulDashscopeVideoTask`                   | 성공한 DashScope 호환 비디오 작업 응답을 설치합니다. `plugin-sdk/provider-test-contracts`에서 가져옵니다.                               |
| `getProviderHttpMocks`                               | 선택적으로 사용하는 제공자 HTTP/인증 Vitest 모의에 접근합니다. `plugin-sdk/provider-http-test-mocks`에서 가져옵니다.                    |
| `installProviderHttpMockCleanup`                     | 각 테스트 후 제공자 HTTP/인증 모의를 재설정합니다. `plugin-sdk/provider-http-test-mocks`에서 가져옵니다.                                |
| `installCommonResolveTargetErrorCases`               | 대상 확인 오류 처리를 위한 공유 테스트 사례입니다. `plugin-sdk/channel-target-testing`에서 가져옵니다.                                 |
| `shouldAckReaction`                                  | 채널에서 확인 반응을 추가해야 하는지 확인합니다. `plugin-sdk/channel-feedback`에서 가져옵니다.                                         |
| `removeAckReactionAfterReply`                        | 응답 전송 후 확인 반응을 제거합니다. `plugin-sdk/channel-feedback`에서 가져옵니다.                                                      |
| `createTestRegistry`                                 | 채널 Plugin 레지스트리 픽스처를 구성합니다. `plugin-sdk/plugin-test-runtime` 또는 `plugin-sdk/channel-test-helpers`에서 가져옵니다.      |
| `createEmptyPluginRegistry`                          | 빈 Plugin 레지스트리 픽스처를 구성합니다. `plugin-sdk/plugin-test-runtime` 또는 `plugin-sdk/channel-test-helpers`에서 가져옵니다.       |
| `setActivePluginRegistry`                            | Plugin 런타임 테스트용 레지스트리 픽스처를 설치합니다. `plugin-sdk/plugin-test-runtime` 또는 `plugin-sdk/channel-test-helpers`에서 가져옵니다. |
| `createRequestCaptureJsonFetch`                      | 미디어 도우미 테스트에서 JSON 가져오기 요청을 캡처합니다. `plugin-sdk/test-env`에서 가져옵니다.                                        |
| `withServer`                                         | 일회용 로컬 HTTP 서버를 대상으로 테스트를 실행합니다. `plugin-sdk/test-env`에서 가져옵니다.                                            |
| `createMockIncomingRequest`                          | 최소 인바운드 HTTP 요청 객체를 구성합니다. `plugin-sdk/test-env`에서 가져옵니다.                                                       |
| `withFetchPreconnect`                                | 사전 연결 훅이 설치된 상태에서 가져오기 테스트를 실행합니다. `plugin-sdk/test-env`에서 가져옵니다.                                     |
| `withEnv` / `withEnvAsync`                           | 환경 변수를 일시적으로 패치합니다. `plugin-sdk/test-env`에서 가져옵니다.                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 격리된 파일 시스템 테스트 픽스처를 생성합니다. `plugin-sdk/test-env`에서 가져옵니다.                                                   |
| `createMockServerResponse`                           | 최소 HTTP 서버 응답 모의를 생성합니다. `plugin-sdk/test-env`에서 가져옵니다.                                                           |
| `createProviderUsageFetch`                           | 제공자 사용량 가져오기 픽스처를 구성합니다. `plugin-sdk/test-env`에서 가져옵니다.                                                      |
| `useFrozenTime` / `useRealTime`                      | 시간에 민감한 테스트를 위해 타이머를 고정하고 복원합니다. `plugin-sdk/test-env`에서 가져옵니다.                                        |
| `createCliRuntimeCapture`                            | 테스트에서 CLI 런타임 출력을 캡처합니다. `plugin-sdk/test-fixtures`에서 가져옵니다.                                                    |
| `importFreshModule`                                  | 모듈 캐시를 우회하도록 새로운 쿼리 토큰을 사용해 ESM 모듈을 가져옵니다. `plugin-sdk/test-fixtures`에서 가져옵니다.                       |
| `bundledPluginRoot` / `bundledPluginFile`            | 번들 Plugin 소스 또는 dist 픽스처 경로를 확인합니다. `plugin-sdk/test-fixtures`에서 가져옵니다.                                        |
| `mockNodeBuiltinModule`                              | 범위가 제한된 Node 내장 Vitest 모의를 설치합니다. `plugin-sdk/test-node-mocks`에서 가져옵니다.                                         |
| `createSandboxTestContext`                           | 샌드박스 테스트 컨텍스트를 구성합니다. `plugin-sdk/test-fixtures`에서 가져옵니다.                                                      |
| `writeSkill`                                         | Skills 픽스처를 작성합니다. `plugin-sdk/test-fixtures`에서 가져옵니다.                                                                             |
| `makeAgentAssistantMessage`                          | 에이전트 트랜스크립트 메시지 픽스처를 구성합니다. `plugin-sdk/test-fixtures`에서 가져옵니다.                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 시스템 이벤트 픽스처를 검사하고 재설정합니다. `plugin-sdk/test-fixtures`에서 가져옵니다.                                                          |
| `sanitizeTerminalText`                               | 어설션을 위해 터미널 출력을 정리합니다. `plugin-sdk/test-fixtures`에서 가져옵니다.                                                          |
| `countLines` / `hasBalancedFences`                   | 청킹 출력 형태를 검증합니다. `plugin-sdk/test-fixtures`에서 가져옵니다.                                                                     |
| `typedCases`                                         | 테이블 기반 테스트를 위해 리터럴 타입을 보존합니다. `plugin-sdk/test-fixtures`에서 가져옵니다.                                                    |

번들 Plugin 계약 스위트도 테스트 전용 레지스트리, 매니페스트, 공개 아티팩트 및 런타임 픽스처 헬퍼에 이러한 SDK 테스트 하위 경로를 사용합니다.
번들 OpenClaw 인벤토리에 의존하는 코어 전용 스위트는 대신
`src/plugins/contracts` 아래에 유지합니다.

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
`installCommonResolveTargetErrorCases`를 사용하십시오.

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel 대상 해석", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // 채널의 대상 해석 로직
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // 채널별 테스트 사례 추가
  it("@username 대상을 해석해야 합니다", () => {
    // ...
  });
});
```

## 테스트 패턴

### 등록 계약 테스트

직접 작성한 `api` 모의 객체를 `register(api)`에 전달하는 단위 테스트는
OpenClaw 로더의 허용 게이트를 검증하지 않습니다. Plugin이 의존하는 각 등록 표면에 대해 로더 기반 스모크 테스트를 하나 이상 추가하십시오. 특히 훅과 메모리 같은 독점 기능에 중요합니다.

필수 메타데이터가 없거나 Plugin이 소유하지 않은 기능 API를 호출하면 실제 로더는 Plugin 등록에 실패합니다. 예를 들어
`api.registerHook(...)`에는 훅 이름이 필요하고,
`api.registerMemoryCapability(...)`에는 Plugin 매니페스트나 내보낸
엔트리에 `kind: "memory"` 선언이 필요합니다.

### 런타임 구성 접근 테스트

`openclaw/plugin-sdk/plugin-test-runtime`의 공유 Plugin 런타임 모의 객체를 우선 사용하십시오.
이 객체의 `runtime.config.loadConfig()` 및 `runtime.config.writeConfigFile(...)`
모의 함수는 기본적으로 예외를 발생시키므로, 테스트에서 더 이상 권장되지 않는 호환성 API의 새로운 사용을 포착할 수 있습니다. 테스트가 레거시 호환성 동작을 명시적으로 검증하는 경우에만 해당 모의 함수를 재정의하십시오.

### 채널 Plugin 단위 테스트

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel Plugin", () => {
  it("구성에서 계정을 해석해야 합니다", () => {
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

  it("비밀 정보를 구체화하지 않고 계정을 검사해야 합니다", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // 토큰 값이 노출되지 않음
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### 제공자 Plugin 단위 테스트

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider Plugin", () => {
  it("동적 모델을 해석해야 합니다", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... 컨텍스트
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("API 키를 사용할 수 있을 때 카탈로그를 반환해야 합니다", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... 컨텍스트
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Plugin 런타임 모의 처리

`createPluginRuntimeStore`를 사용하는 코드의 경우 테스트에서 런타임을 모의 처리하십시오.

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "테스트 런타임이 설정되지 않음",
});

// 테스트 설정에서
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... 기타 모의 객체
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... 기타 네임스페이스
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// 테스트 후
store.clearRuntime();
```

### 인스턴스별 스텁을 사용한 테스트

프로토타입 변경보다 인스턴스별 스텁을 우선 사용하십시오.

```typescript
// 권장: 인스턴스별 스텁
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 지양: 프로토타입 변경
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 계약 테스트(저장소 내 Plugin)

번들 Plugin에는 등록 소유권을 검증하는 계약 테스트가 있습니다.

```bash
pnpm test src/plugins/contracts/
```

이 테스트는 다음을 확인합니다.

- 어떤 Plugin이 어떤 제공자를 등록하는지
- 어떤 Plugin이 어떤 음성 제공자를 등록하는지
- 등록 형태의 정확성
- 런타임 계약 준수

### 범위 지정 테스트 실행

특정 Plugin의 경우:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

계약 테스트만 실행하는 경우:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## 린트 적용(저장소 내 Plugin)

`scripts/run-additional-boundary-checks.mjs`는 CI에서 일련의 `lint:plugins:*`
가져오기 경계 검사를 실행하며, 각 검사는 로컬에서도 독립적으로 실행할 수 있습니다.

| 명령                                                           | 적용 사항                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | 번들 Plugin은 단일체형 `openclaw/plugin-sdk` 루트 배럴을 가져올 수 없습니다.                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | 프로덕션 확장 파일은 저장소의 `src/**` 트리를 직접 가져올 수 없습니다(`../../src/...`).                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | 확장 테스트 파일은 `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` 또는 기타 코어 전용 테스트 헬퍼를 가져올 수 없습니다. |

외부 Plugin에는 이러한 린트 규칙이 적용되지 않지만, 동일한 패턴을 따르는 것이 좋습니다.

## 테스트 구성

OpenClaw는 정보 제공용 V8 커버리지 보고 기능과 함께 Vitest 4를 사용합니다. Plugin 테스트의 경우:

```bash
# 모든 테스트 실행
pnpm test

# 특정 Plugin 테스트 실행
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# 특정 테스트 이름 필터를 사용하여 실행
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# 커버리지와 함께 실행
pnpm test:coverage
```

로컬 실행으로 메모리 압박이 발생하는 경우:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 관련 문서

- [SDK 개요](/ko/plugins/sdk-overview) -- 가져오기 규칙
- [SDK 채널 Plugin](/ko/plugins/sdk-channel-plugins) -- 채널 Plugin 인터페이스
- [SDK 제공자 Plugin](/ko/plugins/sdk-provider-plugins) -- 제공자 Plugin 훅
- [Plugin 빌드](/ko/plugins/building-plugins) -- 시작 안내서
