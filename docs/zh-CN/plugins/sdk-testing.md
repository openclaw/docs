---
read_when:
    - 你正在为一个插件编写测试
    - 你需要来自插件 SDK 的测试工具
    - 你想了解内置插件的契约测试
sidebarTitle: Testing
summary: OpenClaw 插件的测试工具与模式
title: 插件测试
x-i18n:
    generated_at: "2026-04-28T01:18:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: dcc9f0340a651ab742150101ceb78b65ea450b90720bc06e96bb19535db3d83d
    source_path: plugins/sdk-testing.md
    workflow: 15
---

OpenClaw 插件的测试工具、模式以及 lint 强制规则参考。

<Tip>
  **在找测试示例吗？** 操作指南包含已完成的测试示例：
  [渠道插件测试](/zh-CN/plugins/sdk-channel-plugins#step-6-test) 和
  [提供商插件测试](/zh-CN/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 测试工具

**插件 API 模拟导入：** `openclaw/plugin-sdk/plugin-test-api`

**渠道契约导入：** `openclaw/plugin-sdk/channel-contract-testing`

**渠道测试辅助工具导入：** `openclaw/plugin-sdk/channel-test-helpers`

**渠道目标测试导入：** `openclaw/plugin-sdk/channel-target-testing`

**插件契约导入：** `openclaw/plugin-sdk/plugin-test-contracts`

**插件运行时测试导入：** `openclaw/plugin-sdk/plugin-test-runtime`

**提供商契约导入：** `openclaw/plugin-sdk/provider-test-contracts`

**环境 / 网络测试导入：** `openclaw/plugin-sdk/test-env`

**通用夹具导入：** `openclaw/plugin-sdk/test-fixtures`

对于新的插件测试，优先使用下面这些更聚焦的子路径。宽泛的
`openclaw/plugin-sdk/testing` barrel 仅用于兼容旧版。

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
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

| Export                                          | 用途                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `createTestPluginApi`                           | 为直接注册单元测试构建一个最小化的插件 API 模拟。从 `plugin-sdk/plugin-test-api` 导入 |
| `expectChannelInboundContextContract`           | 断言渠道入站上下文的结构。从 `plugin-sdk/channel-contract-testing` 导入 |
| `installChannelOutboundPayloadContractSuite`    | 安装渠道出站负载契约测试用例。从 `plugin-sdk/channel-contract-testing` 导入 |
| `createStartAccountContext`                     | 构建渠道账户生命周期上下文。从 `plugin-sdk/channel-test-helpers` 导入 |
| `installChannelActionsContractSuite`            | 安装通用渠道消息动作契约测试用例。从 `plugin-sdk/channel-test-helpers` 导入 |
| `installChannelSetupContractSuite`              | 安装通用渠道设置契约测试用例。从 `plugin-sdk/channel-test-helpers` 导入 |
| `installChannelStatusContractSuite`             | 安装通用渠道 Status 契约测试用例。从 `plugin-sdk/channel-test-helpers` 导入 |
| `expectDirectoryIds`                            | 从目录列表函数中断言渠道目录 id。从 `plugin-sdk/channel-test-helpers` 导入 |
| `describePluginRegistrationContract`            | 安装插件注册契约检查。从 `plugin-sdk/plugin-test-contracts` 导入 |
| `registerSingleProviderPlugin`                  | 在加载器冒烟测试中注册一个提供商插件。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `registerProviderPlugin`                        | 从单个插件中捕获所有提供商类型。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `registerProviderPlugins`                       | 在多个插件之间捕获提供商注册。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `requireRegisteredProvider`                     | 断言一个提供商集合包含某个 id。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `createRuntimeEnv`                              | 构建一个模拟的 CLI / 插件运行时环境。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `createPluginSetupWizardStatus`                 | 为渠道插件构建设置向导 Status 辅助工具。从 `plugin-sdk/plugin-test-runtime` 导入 |
| `describeOpenAIProviderRuntimeContract`         | 安装提供商家族运行时契约检查。从 `plugin-sdk/provider-test-contracts` 导入 |
| `installCommonResolveTargetErrorCases`          | 目标解析错误处理的共享测试用例。从 `plugin-sdk/channel-target-testing` 导入 |
| `shouldAckReaction`                             | 检查渠道是否应添加 ack reaction。从 `plugin-sdk/channel-feedback` 导入 |
| `removeAckReactionAfterReply`                   | 在回复发送后移除 ack reaction。从 `plugin-sdk/channel-feedback` 导入 |
| `createTestRegistry`                            | 构建一个渠道插件注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入 |
| `createEmptyPluginRegistry`                     | 构建一个空的插件注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入 |
| `setActivePluginRegistry`                       | 为插件运行时测试安装一个注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入 |
| `createRequestCaptureJsonFetch`                 | 在媒体辅助测试中捕获 JSON fetch 请求。从 `plugin-sdk/test-env` 导入 |
| `withFetchPreconnect`                           | 在安装 preconnect 钩子的情况下运行 fetch 测试。从 `plugin-sdk/test-env` 导入 |
| `withEnv` / `withEnvAsync`                      | 临时修改环境变量。从 `plugin-sdk/test-env` 导入 |
| `createTempHomeEnv` / `withTempDir`             | 创建隔离的文件系统测试夹具。从 `plugin-sdk/test-env` 导入 |
| `createMockServerResponse`                      | 创建一个最小化的 HTTP 服务器响应模拟。从 `plugin-sdk/test-env` 导入 |
| `createCliRuntimeCapture`                       | 在测试中捕获 CLI 运行时输出。从 `plugin-sdk/test-fixtures` 导入 |
| `createSandboxTestContext`                      | 构建沙箱测试上下文。从 `plugin-sdk/test-fixtures` 导入 |
| `writeSkill`                                    | 写入 Skills 夹具。从 `plugin-sdk/test-fixtures` 导入 |
| `makeAgentAssistantMessage`                     | 构建智能体转录消息夹具。从 `plugin-sdk/test-fixtures` 导入 |
| `peekSystemEvents` / `resetSystemEventsForTest` | 检查并重置系统事件夹具。从 `plugin-sdk/test-fixtures` 导入 |
| `sanitizeTerminalText`                          | 清理终端输出以便断言。从 `plugin-sdk/test-fixtures` 导入 |
| `countLines` / `hasBalancedFences`              | 断言分块输出的结构。从 `plugin-sdk/test-fixtures` 导入 |
| `runProviderCatalog`                            | 使用测试依赖执行提供商目录钩子 |
| `resolveProviderWizardOptions`                  | 在契约测试中解析提供商设置向导选项 |
| `resolveProviderModelPickerEntries`             | 在契约测试中解析提供商模型选择器条目 |
| `buildProviderPluginMethodChoice`               | 为断言构建提供商向导选项 id |
| `setProviderWizardProvidersResolverForTest`     | 为隔离测试注入提供商向导提供商 |
| `createProviderUsageFetch`                      | 构建提供商用量 fetch 夹具 |
| `useFrozenTime` / `useRealTime`                 | 冻结并恢复计时器，用于时间敏感测试。从 `plugin-sdk/test-env` 导入 |
| `createTestWizardPrompter`                      | 构建一个模拟的设置向导提示器 |
| `createRuntimeTaskFlow`                         | 创建隔离的运行时任务流状态 |
| `typedCases`                                    | 为表驱动测试保留字面量类型。从 `plugin-sdk/test-fixtures` 导入 |

内置插件契约测试套件也会使用 SDK 测试子路径中的仅测试用注册表、manifest、公开产物和运行时夹具辅助工具。依赖内置 OpenClaw 清单的仅核心测试套件仍保留在 `src/plugins/contracts` 下。
新的扩展测试应保持使用已记录的聚焦 SDK 子路径，例如
`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、
`plugin-sdk/channel-test-helpers`、`plugin-sdk/plugin-test-contracts`、
`plugin-sdk/plugin-test-runtime`、`plugin-sdk/provider-test-contracts`、
`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures`，而不是导入宽泛的
`plugin-sdk/testing` 兼容 barrel、仓库中的 `src/**` 文件，或直接导入仓库
`test/helpers/plugins/*` 桥接层。

### 类型

聚焦的测试子路径也会重新导出测试文件中有用的类型：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 测试目标解析

使用 `installCommonResolveTargetErrorCases` 为渠道目标解析添加标准错误用例：

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

## 测试模式

### 测试注册契约

将手写的 `api` mock 传给 `register(api)` 的单元测试，并不会覆盖 OpenClaw 加载器的接受门禁。对于你的插件所依赖的每个注册入口，至少添加一个由加载器驱动的冒烟测试，尤其是钩子和诸如 memory 之类的独占能力。

真实加载器会在缺少必需元数据，或者插件调用了自己并不拥有的能力 API 时拒绝插件注册。例如，
`api.registerHook(...)` 需要一个 hook 名称，而
`api.registerMemoryCapability(...)` 则要求插件 manifest 或导出的入口声明 `kind: "memory"`。

### 测试运行时配置访问

在测试内置渠道插件时，优先使用来自 `openclaw/plugin-sdk/channel-test-helpers`
的共享插件运行时 mock。它的已弃用 `runtime.config.loadConfig()` 和
`runtime.config.writeConfigFile(...)` mock 默认会抛出错误，这样测试就能捕获对兼容性 API 的新使用。只有当测试明确覆盖旧版兼容行为时，才重写这些 mock。

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
    // No token value exposed
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

### 模拟插件运行时

对于使用 `createPluginRuntimeStore` 的代码，在测试中应模拟运行时：

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

内置插件有契约测试，用于验证注册归属：

```bash
pnpm test -- src/plugins/contracts/
```

这些测试会断言：

- 哪些插件注册了哪些提供商
- 哪些插件注册了哪些语音提供商
- 注册结构是否正确
- 运行时契约是否合规

### 运行限定范围测试

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

1. **禁止整体式根导入** —— 会拒绝 `openclaw/plugin-sdk` 根 barrel
2. **禁止直接导入 `src/`** —— 插件不能直接导入 `../../src/`
3. **禁止自导入** —— 插件不能导入自己的 `plugin-sdk/<name>` 子路径

外部插件不受这些 lint 规则约束，但仍建议遵循相同模式。

## 测试配置

OpenClaw 使用 Vitest，并启用 V8 覆盖率阈值。对于插件测试：

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

如果本地运行导致内存压力：

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) -- 导入约定
- [SDK 渠道插件](/zh-CN/plugins/sdk-channel-plugins) -- 渠道插件接口
- [SDK 提供商插件](/zh-CN/plugins/sdk-provider-plugins) -- 提供商插件钩子
- [构建插件](/zh-CN/plugins/building-plugins) -- 入门指南
