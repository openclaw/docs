---
read_when:
    - 你正在为一个插件编写测试
    - 你需要使用来自插件 SDK 的测试工具
    - 你想了解内置插件的契约测试
sidebarTitle: Testing
summary: OpenClaw 插件的测试工具与模式
title: 插件测试
x-i18n:
    generated_at: "2026-04-27T22:50:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad2e95d9db988610931391c37f1fef12014dff717ceb1647bca241a1a438aeae
    source_path: plugins/sdk-testing.md
    workflow: 15
---

OpenClaw 插件的测试工具、模式和 lint 强制规则参考。

<Tip>
  **在找测试示例？** 操作指南包含了完整的测试示例：
  [渠道插件测试](/zh-CN/plugins/sdk-channel-plugins#step-6-test) 和
  [提供商插件测试](/zh-CN/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 测试工具

**导入：** `openclaw/plugin-sdk/testing`

该测试子路径为插件作者导出了一组精简的辅助工具：

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
```

### 可用导出

| 导出                                   | 用途                           |
| -------------------------------------- | ------------------------------ |
| `installCommonResolveTargetErrorCases` | 目标解析错误处理的共享测试用例 |
| `shouldAckReaction`                    | 检查某个渠道是否应添加确认反应 |
| `removeAckReactionAfterReply`          | 在回复送达后移除确认反应       |
| `createTestRegistry`                   | 构建渠道插件注册表夹具         |
| `createEmptyPluginRegistry`            | 构建空的插件注册表夹具         |
| `setActivePluginRegistry`              | 为插件运行时测试安装注册表夹具 |
| `createRequestCaptureJsonFetch`        | 在媒体辅助工具测试中捕获 JSON fetch 请求 |
| `withFetchPreconnect`                  | 在安装了预连接钩子的情况下运行 fetch 测试 |
| `withEnv` / `withEnvAsync`             | 临时修改环境变量               |
| `createTempHomeEnv` / `withTempDir`    | 创建隔离的文件系统测试夹具     |
| `createMockServerResponse`             | 创建最小化的 HTTP 服务器响应 mock |
| `registerSingleProviderPlugin`         | 在加载器冒烟测试中注册一个提供商插件 |
| `registerProviderPlugin`               | 从一个插件中捕获所有提供商类型 |
| `requireRegisteredProvider`            | 断言提供商集合包含某个 id      |
| `createProviderUsageFetch`             | 构建提供商用量 fetch 夹具      |
| `useFrozenTime` / `useRealTime`        | 为时间敏感测试冻结和恢复计时器 |
| `createRuntimeEnv`                     | 构建一个 mock 的 CLI/插件运行时环境 |
| `createTestWizardPrompter`             | 构建一个 mock 的设置向导提示器 |
| `createPluginSetupWizardStatus`        | 为渠道插件构建设置状态辅助工具 |
| `createRuntimeTaskFlow`                | 创建隔离的运行时任务流状态     |
| `typedCases`                           | 为表驱动测试保留字面量类型     |

### 类型

该测试子路径还会重新导出测试文件中有用的类型：

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

## 测试目标解析

使用 `installCommonResolveTargetErrorCases` 为渠道目标解析添加标准错误用例：

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // 你的渠道目标解析逻辑
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // 添加渠道特定的测试用例
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## 测试模式

### 测试注册契约

将手写的 `api` mock 传给 `register(api)` 的单元测试，并不会覆盖 OpenClaw 加载器的接受门禁。对于你的插件所依赖的每个注册表面，至少添加一个基于加载器的冒烟测试，尤其是钩子和诸如 memory 之类的独占能力。

真实加载器会在缺少必需元数据，或插件调用了其并不拥有的能力 API 时使插件注册失败。例如，
`api.registerHook(...)` 需要一个钩子名称，而
`api.registerMemoryCapability(...)` 则要求插件清单或导出的入口声明 `kind: "memory"`。

### 测试运行时配置访问

在测试内置插件时，优先使用仓库测试辅助工具中共享的插件运行时 mock。它的已弃用 `runtime.config.loadConfig()` 和 `runtime.config.writeConfigFile(...)` mocks 默认会抛错，这样测试就能捕获对兼容性 API 的新增使用。只有当测试明确覆盖旧版兼容行为时，才应重写这些 mocks。

### 渠道插件的单元测试

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
    // 不暴露 token 值
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### 提供商插件的单元测试

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

### Mock 插件运行时

对于使用 `createPluginRuntimeStore` 的代码，在测试中应 mock 运行时：

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// 在测试设置中
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... 其他 mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... 其他命名空间
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// 测试结束后
store.clearRuntime();
```

### 使用按实例 stub 进行测试

优先使用按实例 stub，而不是修改原型：

```typescript
// 推荐：按实例 stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// 避免：修改原型
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 契约测试（仓库内插件）

内置插件带有用于验证注册归属的契约测试：

```bash
pnpm test -- src/plugins/contracts/
```

这些测试会断言：

- 哪些插件注册了哪些提供商
- 哪些插件注册了哪些语音提供商
- 注册结构的正确性
- 运行时契约合规性

### 运行限定范围的测试

针对特定插件：

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

仅运行契约测试：

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## lint 强制规则（仓库内插件）

对于仓库内插件，`pnpm check` 会强制执行三条规则：

1. **禁止使用单体根导入** —— 拒绝使用 `openclaw/plugin-sdk` 根 barrel
2. **禁止直接导入 `src/`** —— 插件不能直接导入 `../../src/`
3. **禁止自导入** —— 插件不能导入自己的 `plugin-sdk/<name>` 子路径

外部插件不受这些 lint 规则约束，但仍建议遵循相同模式。

## 测试配置

OpenClaw 使用带有 V8 覆盖率阈值的 Vitest。对于插件测试：

```bash
# 运行所有测试
pnpm test

# 运行特定插件测试
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# 使用特定测试名称过滤器运行
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# 运行并生成覆盖率
pnpm test:coverage
```

如果本地运行导致内存压力：

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) -- 导入约定
- [SDK 渠道插件](/zh-CN/plugins/sdk-channel-plugins) -- 渠道插件接口
- [SDK 提供商插件](/zh-CN/plugins/sdk-provider-plugins) -- 提供商插件钩子
- [构建插件](/zh-CN/plugins/building-plugins) -- 入门指南
