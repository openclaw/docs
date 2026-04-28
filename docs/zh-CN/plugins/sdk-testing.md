---
read_when:
    - 你正在为一个插件编写测试
    - 你需要来自插件 SDK 的测试工具
    - 你想了解内置插件的契约测试
sidebarTitle: Testing
summary: OpenClaw 插件的测试工具与模式
title: 插件测试
x-i18n:
    generated_at: "2026-04-28T00:33:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5c96065868b3c8fcd30ef3e51fb7c13e73d5742c8f1cc66bc93eb089c0d1a76
    source_path: plugins/sdk-testing.md
    workflow: 15
---

OpenClaw 插件的测试工具、模式和 lint 强制规则参考。

<Tip>
  **在找测试示例？** 操作指南中包含完整的测试示例：
  [渠道插件测试](/zh-CN/plugins/sdk-channel-plugins#step-6-test) 和
  [提供商插件测试](/zh-CN/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 测试工具

**通用导入：** `openclaw/plugin-sdk/testing`

**插件 API mock 导入：** `openclaw/plugin-sdk/plugin-test-api`

**渠道契约导入：** `openclaw/plugin-sdk/channel-contract-testing`

**渠道测试辅助工具导入：** `openclaw/plugin-sdk/channel-test-helpers`

**插件契约导入：** `openclaw/plugin-sdk/plugin-test-contracts`

**插件运行时测试导入：** `openclaw/plugin-sdk/plugin-test-runtime`

**提供商契约导入：** `openclaw/plugin-sdk/provider-test-contracts`

**环境/网络测试导入：** `openclaw/plugin-sdk/test-env`

**通用 fixture 导入：** `openclaw/plugin-sdk/test-fixtures`

testing 子路径会为插件作者导出一组精简的辅助工具：

```typescript
import {
  installCommonResolveTargetErrorCases,
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/testing";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { withEnv, withFetchPreconnect } from "openclaw/plugin-sdk/test-env";
import { createCliRuntimeCapture, typedCases } from "openclaw/plugin-sdk/test-fixtures";
```

### 可用导出

| Export                                          | 用途 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `createTestPluginApi`                           | 为直接注册单元测试构建最小化的插件 API mock。从 `plugin-sdk/plugin-test-api` 导入 |
| `expectChannelInboundContextContract`           | 断言渠道入站上下文的结构。从 `plugin-sdk/channel-contract-testing` 导入 |
| `installChannelOutboundPayloadContractSuite`    | 安装渠道出站负载契约测试用例。从 `plugin-sdk/channel-contract-testing` 导入 |
| `createStartAccountContext`                     | 构建渠道账号生命周期上下文。从 `plugin-sdk/channel-test-helpers` 导入 |
| `describePluginRegistrationContract`            | 安装插件注册契约检查。从 `plugin-sdk/plugin-test-contracts` 导入 |
| `registerSingleProviderPlugin`                  | 在加载器冒烟测试中注册一个提供商插件。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `registerProviderPlugin`                        | 捕获单个插件中的所有提供商类型。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `registerProviderPlugins`                       | 捕获多个插件中的提供商注册。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `requireRegisteredProvider`                     | 断言提供商集合中包含某个 id。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `createRuntimeEnv`                              | 构建一个 mock 的 CLI/插件运行时环境。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `createPluginSetupWizardStatus`                 | 为渠道插件构建设置向导状态辅助工具。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `describeOpenAIProviderRuntimeContract`         | 安装提供商系列运行时契约检查。从 `plugin-sdk/provider-test-contracts` 导入 |
| `installCommonResolveTargetErrorCases`          | 用于目标解析错误处理的共享测试用例 |
| `shouldAckReaction`                             | 检查渠道是否应添加 ack reaction |
| `removeAckReactionAfterReply`                   | 在回复发送后移除 ack reaction |
| `createTestRegistry`                            | 构建渠道插件注册表 fixture |
| `createEmptyPluginRegistry`                     | 构建空的插件注册表 fixture |
| `setActivePluginRegistry`                       | 为插件运行时测试安装注册表 fixture |
| `createRequestCaptureJsonFetch`                 | 在媒体辅助工具测试中捕获 JSON fetch 请求。从 `plugin-sdk/test-env` 导入 |
| `withFetchPreconnect`                           | 在安装了 preconnect 钩子的情况下运行 fetch 测试。从 `plugin-sdk/test-env` 导入 |
| `withEnv` / `withEnvAsync`                      | 临时修改环境变量。从 `plugin-sdk/test-env` 导入 |
| `createTempHomeEnv` / `withTempDir`             | 创建隔离的文件系统测试 fixture。从 `plugin-sdk/test-env` 导入 |
| `createMockServerResponse`                      | 创建最小化的 HTTP 服务器响应 mock。从 `plugin-sdk/test-env` 导入 |
| `createCliRuntimeCapture`                       | 在测试中捕获 CLI 运行时输出。从 `plugin-sdk/test-fixtures` 导入 |
| `createSandboxTestContext`                      | 构建沙箱测试上下文。从 `plugin-sdk/test-fixtures` 导入 |
| `writeSkill`                                    | 写入 Skills fixture。从 `plugin-sdk/test-fixtures` 导入 |
| `makeAgentAssistantMessage`                     | 构建智能体对话消息 fixture。从 `plugin-sdk/test-fixtures` 导入 |
| `peekSystemEvents` / `resetSystemEventsForTest` | 检查并重置系统事件 fixture。从 `plugin-sdk/test-fixtures` 导入 |
| `sanitizeTerminalText`                          | 清理终端输出以便断言。从 `plugin-sdk/test-fixtures` 导入 |
| `countLines` / `hasBalancedFences`              | 断言分块输出的结构。从 `plugin-sdk/test-fixtures` 导入 |
| `runProviderCatalog`                            | 使用测试依赖执行提供商目录钩子 |
| `resolveProviderWizardOptions`                  | 在契约测试中解析提供商设置向导选项 |
| `resolveProviderModelPickerEntries`             | 在契约测试中解析提供商模型选择器条目 |
| `buildProviderPluginMethodChoice`               | 为断言构建提供商向导选项 id |
| `setProviderWizardProvidersResolverForTest`     | 为隔离测试注入提供商向导提供商 |
| `createProviderUsageFetch`                      | 构建提供商用量 fetch fixture |
| `useFrozenTime` / `useRealTime`                 | 为时间敏感测试冻结并恢复计时器。从 `plugin-sdk/test-env` 导入 |
| `createTestWizardPrompter`                      | 构建 mock 的设置向导提示器 |
| `createRuntimeTaskFlow`                         | 创建隔离的运行时任务流状态 |
| `typedCases`                                    | 为表驱动测试保留字面量类型。从 `plugin-sdk/test-fixtures` 导入 |

内置插件契约测试套件也会使用 SDK testing 子路径中的仅测试注册表、manifest、公共产物和运行时 fixture 辅助工具。依赖 OpenClaw 内置清单的仅核心测试套件保留在 `src/plugins/contracts` 下。
新的扩展测试应使用 `openclaw/plugin-sdk/testing` 或更窄且已文档化的 SDK 子路径，例如 `plugin-sdk/plugin-test-api` 或
`plugin-sdk/channel-contract-testing`、`plugin-sdk/channel-test-helpers`、
`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、
`plugin-sdk/provider-test-contracts`、`plugin-sdk/test-env` 或
`plugin-sdk/test-fixtures`，而不是直接导入仓库中的 `src/**`
文件或仓库中的 `test/helpers/plugins/*` bridge。

### 类型

testing 子路径也会重新导出一些在测试文件中有用的类型：

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

使用 `installCommonResolveTargetErrorCases`
为渠道目标解析添加标准错误用例：

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

## 测试模式

### 测试注册契约

将手写的 `api` mock 传给 `register(api)` 的单元测试，并不会覆盖
OpenClaw 的加载器验收门禁。对于你的插件所依赖的每一个注册接口，至少添加一个由加载器支持的冒烟测试，特别是钩子和内存这类排他性能力。

真实加载器会在缺少必需元数据，或者插件调用了其并不拥有的能力 API 时拒绝插件注册。例如，
`api.registerHook(...)` 需要一个钩子名称，而
`api.registerMemoryCapability(...)` 则要求插件 manifest 或导出的入口声明
`kind: "memory"`。

### 测试运行时配置访问

在测试内置渠道插件时，优先使用来自 `openclaw/plugin-sdk/channel-test-helpers`
的共享插件运行时 mock。其中已弃用的 `runtime.config.loadConfig()` 和
`runtime.config.writeConfigFile(...)` mock 默认会抛出异常，以便测试能捕捉到对兼容性 API 的新使用。只有在测试明确覆盖旧版兼容行为时，才应覆盖这些 mock。

### 对渠道插件进行单元测试

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

### 对提供商插件进行单元测试

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

### mock 插件运行时

对于使用 `createPluginRuntimeStore` 的代码，请在测试中 mock 运行时：

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

### 使用按实例 stub 进行测试

优先使用按实例 stub，而不是修改原型：

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## 契约测试（仓库内插件）

内置插件包含用于验证注册归属的契约测试：

```bash
pnpm test -- src/plugins/contracts/
```

这些测试会断言：

- 哪些插件注册了哪些提供商
- 哪些插件注册了哪些语音提供商
- 注册结构是否正确
- 是否符合运行时契约

### 运行限定范围的测试

针对某个特定插件：

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

1. **禁止使用单体根导入** —— 会拒绝 `openclaw/plugin-sdk` 根 barrel
2. **禁止直接导入 `src/`** —— 插件不能直接导入 `../../src/`
3. **禁止自导入** —— 插件不能导入其自身的 `plugin-sdk/<name>` 子路径

外部插件不受这些 lint 规则约束，但仍建议遵循相同模式。

## 测试配置

OpenClaw 使用带有 V8 覆盖率阈值的 Vitest。对于插件测试：

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

如果本地运行造成内存压力：

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) -- 导入约定
- [SDK 渠道插件](/zh-CN/plugins/sdk-channel-plugins) -- 渠道插件接口
- [SDK 提供商插件](/zh-CN/plugins/sdk-provider-plugins) -- 提供商插件钩子
- [构建插件](/zh-CN/plugins/building-plugins) -- 入门指南
