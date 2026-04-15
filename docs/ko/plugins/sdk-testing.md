---
read_when:
    - 당신은 Plugin에 대한 테스트를 작성하고 있습니다
    - Plugin SDK의 테스트 유틸리티가 필요합니다
    - 번들 Plugin의 계약 테스트를 이해하고 싶습니다
sidebarTitle: Testing
summary: OpenClaw Plugin용 테스트 유틸리티와 패턴
title: Plugin 테스트
x-i18n:
    generated_at: "2026-04-15T19:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f75bd3f3b5ba34b05786e0dd96d493c36db73a1d258998bf589e27e45c0bd09
    source_path: plugins/sdk-testing.md
    workflow: 15
---

# Plugin 테스트

OpenClaw Plugin용 테스트 유틸리티, 패턴, 그리고 lint 적용에 대한 참조 문서입니다.

<Tip>
  **테스트 예제를 찾고 있나요?** 단계별 가이드에는 실제 테스트 예제가 포함되어 있습니다:
  [채널 Plugin 테스트](/ko/plugins/sdk-channel-plugins#step-6-test) 및
  [Provider Plugin 테스트](/ko/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## 테스트 유틸리티

**가져오기:** `openclaw/plugin-sdk/testing`

`testing` 하위 경로는 Plugin 작성자를 위해 엄선된 소수의 헬퍼를 내보냅니다:

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### 사용 가능한 내보내기

| 내보내기                               | 용도                                             |
| -------------------------------------- | ------------------------------------------------ |
| `installCommonResolveTargetErrorCases` | 대상 확인 오류 처리를 위한 공통 테스트 케이스    |
| `shouldAckReaction`                    | 채널이 ack 반응을 추가해야 하는지 확인           |
| `removeAckReactionAfterReply`          | 응답 전달 후 ack 반응 제거                       |

### 타입

`testing` 하위 경로는 테스트 파일에서 유용한 타입도 다시 내보냅니다:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
  OpenClawConfig,
  PluginRuntime,
  RuntimeEnv,
  MockFn,
} from "openclaw/plugin-sdk/testing";
```

## 대상 확인 테스트

채널 대상 확인을 위한 표준 오류 케이스를 추가하려면 `installCommonResolveTargetErrorCases`를 사용하세요:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

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

### Provider Plugin 단위 테스트

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

### Plugin 런타임 모킹

`createPluginRuntimeStore`를 사용하는 코드의 경우, 테스트에서 런타임을 모킹하세요:

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
    loadConfig: vi.fn(),
    writeConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### 인스턴스별 스텁을 사용한 테스트

프로토타입 변경보다 인스턴스별 스텁을 우선하세요:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 계약 테스트(리포지토리 내부 Plugin)

번들 Plugin에는 등록 소유권을 검증하는 계약 테스트가 있습니다:

```bash
pnpm test -- src/plugins/contracts/
```

이 테스트는 다음을 검증합니다:

- 어떤 Plugin이 어떤 Provider를 등록하는지
- 어떤 Plugin이 어떤 speech Provider를 등록하는지
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

## lint 적용(리포지토리 내부 Plugin)

리포지토리 내부 Plugin에는 `pnpm check`를 통해 세 가지 규칙이 적용됩니다:

1. **단일 루트 import 금지** -- `openclaw/plugin-sdk` 루트 배럴은 허용되지 않습니다
2. **직접적인 `src/` import 금지** -- Plugin은 `../../src/`를 직접 import할 수 없습니다
3. **자기 자신 import 금지** -- Plugin은 자신의 `plugin-sdk/<name>` 하위 경로를 import할 수 없습니다

외부 Plugin에는 이러한 lint 규칙이 적용되지 않지만, 동일한 패턴을 따르는 것이 권장됩니다.

## 테스트 설정

OpenClaw는 V8 커버리지 임곗값과 함께 Vitest를 사용합니다. Plugin 테스트의 경우:

```bash
# 모든 테스트 실행
pnpm test

# 특정 Plugin 테스트 실행
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# 특정 테스트 이름 필터로 실행
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# 커버리지와 함께 실행
pnpm test:coverage
```

로컬 실행에서 메모리 압박이 발생하는 경우:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 관련 문서

- [SDK 개요](/ko/plugins/sdk-overview) -- import 규칙
- [SDK 채널 Plugins](/ko/plugins/sdk-channel-plugins) -- 채널 Plugin 인터페이스
- [SDK Provider Plugins](/ko/plugins/sdk-provider-plugins) -- Provider Plugin 훅
- [Plugin 만들기](/ko/plugins/building-plugins) -- 시작 가이드
