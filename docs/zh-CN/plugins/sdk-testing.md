---
read_when:
    - 你正在为插件编写测试
    - 你需要插件 SDK 中的测试工具函数。
    - 你想了解内置插件的契约测试
sidebarTitle: Testing
summary: OpenClaw 插件的测试工具和模式
title: 插件测试
x-i18n:
    generated_at: "2026-06-27T02:58:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw 插件的测试工具、模式和 lint 强制执行参考。

<Tip>
  **在找测试示例？** 操作指南包含完整测试示例：
  [渠道插件测试](/zh-CN/plugins/sdk-channel-plugins#step-6-test) 和
  [提供商插件测试](/zh-CN/plugins/sdk-provider-plugins#step-6-test)。
</Tip>

## 测试工具

这些测试辅助子路径是 OpenClaw 自有内置插件测试的仓库本地源码入口点。它们不是第三方插件的包导出，并且可能导入 Vitest 或其他仅限仓库使用的测试依赖。

**插件 API mock 导入：** `openclaw/plugin-sdk/plugin-test-api`

**Agent runtime contract 导入：** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**渠道 contract 导入：** `openclaw/plugin-sdk/channel-contract-testing`

**渠道测试辅助导入：** `openclaw/plugin-sdk/channel-test-helpers`

**渠道目标测试导入：** `openclaw/plugin-sdk/channel-target-testing`

**插件 contract 导入：** `openclaw/plugin-sdk/plugin-test-contracts`

**插件运行时测试导入：** `openclaw/plugin-sdk/plugin-test-runtime`

**提供商 contract 导入：** `openclaw/plugin-sdk/provider-test-contracts`

**提供商 HTTP mock 导入：** `openclaw/plugin-sdk/provider-http-test-mocks`

**环境/网络测试导入：** `openclaw/plugin-sdk/test-env`

**通用 fixture 导入：** `openclaw/plugin-sdk/test-fixtures`

**Node 内置 mock 导入：** `openclaw/plugin-sdk/test-node-mocks`

在 OpenClaw 仓库内，为新的内置插件测试优先使用下面这些聚焦的子路径。宽泛的
`openclaw/plugin-sdk/testing` barrel 仅用于旧版兼容。
仓库护栏会拒绝来自 `plugin-sdk/testing` 和
`plugin-sdk/test-utils` 的新真实导入；这些名称仅作为兼容性记录测试的已弃用兼容表面保留。

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

### 可用导出

| 导出                                                 | 用途                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | 为直接注册单元测试构建最小插件 API 模拟。从 `plugin-sdk/plugin-test-api` 导入                                                            |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | 用于原生智能体运行时适配器的共享身份验证配置文件契约夹具。从 `plugin-sdk/agent-runtime-test-contracts` 导入                               |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | 用于原生智能体运行时适配器的共享投递抑制契约夹具。从 `plugin-sdk/agent-runtime-test-contracts` 导入                                       |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | 用于原生智能体运行时适配器的共享回退分类契约夹具。从 `plugin-sdk/agent-runtime-test-contracts` 导入                                       |
| `createParameterFreeTool`                            | 为原生运行时契约测试构建动态工具架构夹具。从 `plugin-sdk/agent-runtime-test-contracts` 导入                                                |
| `expectChannelInboundContextContract`                | 断言渠道入站上下文形状。从 `plugin-sdk/channel-contract-testing` 导入                                                                      |
| `installChannelOutboundPayloadContractSuite`         | 安装渠道出站载荷契约用例。从 `plugin-sdk/channel-contract-testing` 导入                                                                    |
| `createStartAccountContext`                          | 构建渠道账号生命周期上下文。从 `plugin-sdk/channel-test-helpers` 导入                                                                      |
| `installChannelActionsContractSuite`                 | 安装通用渠道消息动作契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                                                    |
| `installChannelSetupContractSuite`                   | 安装通用渠道设置契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                                                        |
| `installChannelStatusContractSuite`                  | 安装通用渠道状态契约用例。从 `plugin-sdk/channel-test-helpers` 导入                                                                        |
| `expectDirectoryIds`                                 | 从目录列表函数断言渠道目录 ID。从 `plugin-sdk/channel-test-helpers` 导入                                                                   |
| `assertBundledChannelEntries`                        | 断言内置渠道入口点暴露预期的公共契约。从 `plugin-sdk/channel-test-helpers` 导入                                                            |
| `formatEnvelopeTimestamp`                            | 格式化确定性的信封时间戳。从 `plugin-sdk/channel-test-helpers` 导入                                                                        |
| `expectPairingReplyText`                             | 断言渠道配对回复文本并提取其代码。从 `plugin-sdk/channel-test-helpers` 导入                                                                |
| `describePluginRegistrationContract`                 | 安装插件注册契约检查。从 `plugin-sdk/plugin-test-contracts` 导入                                                                           |
| `registerSingleProviderPlugin`                       | 在加载器冒烟测试中注册一个提供商插件。从 `plugin-sdk/plugin-test-runtime` 导入                                                             |
| `registerProviderPlugin`                             | 从一个插件捕获所有提供商类型。从 `plugin-sdk/plugin-test-runtime` 导入                                                                     |
| `registerProviderPlugins`                            | 跨多个插件捕获提供商注册。从 `plugin-sdk/plugin-test-runtime` 导入                                                                         |
| `requireRegisteredProvider`                          | 断言提供商集合包含某个 ID。从 `plugin-sdk/plugin-test-runtime` 导入                                                                        |
| `createRuntimeEnv`                                   | 构建模拟的 CLI/插件运行时环境。从 `plugin-sdk/plugin-test-runtime` 导入                                                                    |
| `createPluginSetupWizardStatus`                      | 为渠道插件构建设置状态辅助工具。从 `plugin-sdk/plugin-test-runtime` 导入                                                                   |
| `describeOpenAIProviderRuntimeContract`              | 安装提供商系列运行时契约检查。从 `plugin-sdk/provider-test-contracts` 导入                                                                 |
| `expectPassthroughReplayPolicy`                      | 断言提供商重放策略会透传提供商拥有的工具和元数据。从 `plugin-sdk/provider-test-contracts` 导入                                             |
| `runRealtimeSttLiveTest`                             | 使用共享音频夹具运行实时 STT 提供商实时测试。从 `plugin-sdk/provider-test-contracts` 导入                                                  |
| `normalizeTranscriptForMatch`                        | 在模糊断言前规范化实时转录输出。从 `plugin-sdk/provider-test-contracts` 导入                                                               |
| `expectExplicitVideoGenerationCapabilities`          | 断言视频提供商声明显式生成模式能力。从 `plugin-sdk/provider-test-contracts` 导入                                                           |
| `expectExplicitMusicGenerationCapabilities`          | 断言音乐提供商声明显式生成/编辑能力。从 `plugin-sdk/provider-test-contracts` 导入                                                          |
| `mockSuccessfulDashscopeVideoTask`                   | 安装成功的 DashScope 兼容视频任务响应。从 `plugin-sdk/provider-test-contracts` 导入                                                        |
| `getProviderHttpMocks`                               | 访问选择启用的提供商 HTTP/身份验证 Vitest 模拟。从 `plugin-sdk/provider-http-test-mocks` 导入                                              |
| `installProviderHttpMockCleanup`                     | 在每个测试后重置提供商 HTTP/身份验证模拟。从 `plugin-sdk/provider-http-test-mocks` 导入                                                    |
| `installCommonResolveTargetErrorCases`               | 用于目标解析错误处理的共享测试用例。从 `plugin-sdk/channel-target-testing` 导入                                                            |
| `shouldAckReaction`                                  | 检查渠道是否应添加 ack reaction。从 `plugin-sdk/channel-feedback` 导入                                                                     |
| `removeAckReactionAfterReply`                        | 回复投递后移除 ack reaction。从 `plugin-sdk/channel-feedback` 导入                                                                         |
| `createTestRegistry`                                 | 构建渠道插件注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入                                      |
| `createEmptyPluginRegistry`                          | 构建空插件注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入                                        |
| `setActivePluginRegistry`                            | 为插件运行时测试安装注册表夹具。从 `plugin-sdk/plugin-test-runtime` 或 `plugin-sdk/channel-test-helpers` 导入                              |
| `createRequestCaptureJsonFetch`                      | 在媒体辅助工具测试中捕获 JSON fetch 请求。从 `plugin-sdk/test-env` 导入                                                                    |
| `withServer`                                         | 针对一次性本地 HTTP 服务器运行测试。从 `plugin-sdk/test-env` 导入                                                                          |
| `createMockIncomingRequest`                          | 构建最小传入 HTTP 请求对象。从 `plugin-sdk/test-env` 导入                                                                                  |
| `withFetchPreconnect`                                | 在安装预连接钩子的情况下运行 fetch 测试。从 `plugin-sdk/test-env` 导入                                                                     |
| `withEnv` / `withEnvAsync`                           | 临时修补环境变量。从 `plugin-sdk/test-env` 导入                                                                                            |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | 创建隔离的文件系统测试夹具。从 `plugin-sdk/test-env` 导入                                                                                  |
| `createMockServerResponse`                           | 创建最小 HTTP 服务器响应模拟。从 `plugin-sdk/test-env` 导入                                                                                |
| `createCliRuntimeCapture`                            | 在测试中捕获 CLI 运行时输出。从 `plugin-sdk/test-fixtures` 导入                                                                            |
| `importFreshModule`                                  | 使用新的查询令牌导入 ESM 模块以绕过模块缓存。从 `plugin-sdk/test-fixtures` 导入                                                            |
| `bundledPluginRoot` / `bundledPluginFile`            | 解析内置插件源代码或 dist 夹具路径。从 `plugin-sdk/test-fixtures` 导入                                                                     |
| `mockNodeBuiltinModule`                              | 安装窄范围的 Node 内置 Vitest 模拟。从 `plugin-sdk/test-node-mocks` 导入                                                                   |
| `createSandboxTestContext`                           | 构建沙箱测试上下文。从 `plugin-sdk/test-fixtures` 导入                                                                                     |
| `writeSkill`                                         | 写入 Skills 夹具。从 `plugin-sdk/test-fixtures` 导入                                                                                       |
| `makeAgentAssistantMessage`                          | 构建智能体转录消息夹具。从 `plugin-sdk/test-fixtures` 导入                                                                                 |
| `peekSystemEvents` / `resetSystemEventsForTest`      | 检查并重置系统事件夹具。从 `plugin-sdk/test-fixtures` 导入                                                                                 |
| `sanitizeTerminalText`                               | 清理终端输出以用于断言。从 `plugin-sdk/test-fixtures` 导入                                                                                 |
| `countLines` / `hasBalancedFences`                   | 断言分块输出形状。从 `plugin-sdk/test-fixtures` 导入                                                                                       |
| `runProviderCatalog`                                 | 使用测试依赖项执行提供商目录钩子                                                                                                         |
| `resolveProviderWizardOptions`                       | 在契约测试中解析提供商设置向导选项                                                                                                       |
| `resolveProviderModelPickerEntries`                  | 在契约测试中解析提供商模型选择器条目                                                                                                     |
| `buildProviderPluginMethodChoice`                    | 构建用于断言的提供商向导选择 ID                                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | 为隔离测试注入提供商向导提供商                                                                                                           |
| `createProviderUsageFetch`                           | 构建提供商用量获取 fixture                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | 为时间敏感测试冻结并恢复计时器。从 `plugin-sdk/test-env` 导入                                                    |
| `createTestWizardPrompter`                           | 构建一个模拟的设置向导提示器                                                                                                     |
| `createRuntimeTaskFlow`                              | 创建隔离的运行时任务流状态                                                                                                  |
| `typedCases`                                         | 为表驱动测试保留字面量类型。从 `plugin-sdk/test-fixtures` 导入                                                    |

内置插件契约测试套件也使用 SDK 测试子路径，用于仅测试的
注册表、清单、公开产物和运行时测试夹具辅助工具。依赖内置 OpenClaw 清单的
仅核心测试套件保留在 `src/plugins/contracts` 下。
新的扩展测试应放在有文档说明的聚焦 SDK 子路径上，例如
`plugin-sdk/plugin-test-api`、`plugin-sdk/channel-contract-testing`、
`plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/channel-test-helpers`、
`plugin-sdk/plugin-test-contracts`、`plugin-sdk/plugin-test-runtime`、
`plugin-sdk/provider-test-contracts`、`plugin-sdk/provider-http-test-mocks`、
`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures`，而不是直接导入
宽泛的 `plugin-sdk/testing` 兼容性聚合导出、仓库 `src/**` 文件，或仓库
`test/helpers/*` 桥接。

### 类型

聚焦测试子路径也会重新导出测试文件中有用的类型：

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## 测试目标解析

使用 `installCommonResolveTargetErrorCases` 为
渠道目标解析添加标准错误用例：

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

将手写 `api` mock 传给 `register(api)` 的单元测试不会覆盖
OpenClaw 加载器的准入门槛。对于插件依赖的每个注册表面，至少添加一个由加载器支撑的冒烟测试，
尤其是钩子和记忆等独占能力。

当缺少必需元数据，或插件调用了它不拥有的能力 API 时，真实加载器会使插件注册失败。
例如，`api.registerHook(...)` 需要钩子名称，
而 `api.registerMemoryCapability(...)` 需要插件清单或导出的
入口声明 `kind: "memory"`。

### 测试运行时配置访问

测试内置渠道插件时，优先使用 `openclaw/plugin-sdk/channel-test-helpers`
中的共享插件运行时 mock。它已弃用的 `runtime.config.loadConfig()` 和
`runtime.config.writeConfigFile(...)` mock 默认会抛错，因此测试能捕获对兼容性 API 的新用法。
只有当测试明确覆盖旧版兼容行为时，才覆盖这些 mock。

### 单元测试渠道插件

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

### 单元测试提供商插件

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

对于使用 `createPluginRuntimeStore` 的代码，在测试中 mock 运行时：

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

内置插件有契约测试，用于验证注册所有权：

```bash
pnpm test -- src/plugins/contracts/
```

这些测试会断言：

- 哪些插件注册了哪些提供商
- 哪些插件注册了哪些语音提供商
- 注册形状正确性
- 运行时契约合规性

### 运行限定范围的测试

对于特定插件：

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

仅运行契约测试：

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint 强制规则（仓库内插件）

`pnpm check` 会对仓库内插件强制执行三条规则：

1. **禁止整体根导入** -- 会拒绝 `openclaw/plugin-sdk` 根聚合导出
2. **禁止直接 `src/` 导入** -- 插件不能直接导入 `../../src/`
3. **禁止自导入** -- 插件不能导入自己的 `plugin-sdk/<name>` 子路径

外部插件不受这些 lint 规则约束，但建议遵循相同模式。

## 测试配置

OpenClaw 使用 Vitest，并配置 V8 覆盖率阈值。对于插件测试：

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

## 相关

- [SDK 概览](/zh-CN/plugins/sdk-overview) -- 导入约定
- [SDK 渠道插件](/zh-CN/plugins/sdk-channel-plugins) -- 渠道插件接口
- [SDK 提供商插件](/zh-CN/plugins/sdk-provider-plugins) -- 提供商插件钩子
- [Building Plugins](/zh-CN/plugins/building-plugins) -- 入门指南
